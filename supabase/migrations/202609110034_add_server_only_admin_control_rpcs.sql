create or replace function private.write_audit_actor(
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_summary text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,summary,metadata)
  values(p_actor_user_id,p_action,p_entity_type,p_entity_id,p_summary,coalesce(p_metadata,'{}'::jsonb));
end;$$;

revoke all on function private.write_audit_actor(uuid,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function private.write_audit_actor(uuid,text,text,text,text,jsonb) to service_role;

create or replace function public.server_review_claim(p_actor_id uuid,p_actor_role text,p_claim_id uuid,p_review_type text,p_decision text,p_comment text default null)
returns public.claims language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_claim public.claims%rowtype; v_next text;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_review_type not in ('scientific','compliance') then raise exception 'Invalid review type'; end if;
  if p_decision not in ('approved','rejected','changes_requested') then raise exception 'Invalid decision'; end if;
  select * into v_claim from public.claims where id=p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if v_claim.category='health' and p_decision='approved' then raise exception 'Health claims cannot be approved in this workflow'; end if;
  if p_review_type='scientific' and v_claim.status not in ('draft','scientific_review') then raise exception 'Claim is not in scientific review stage'; end if;
  if p_review_type='scientific' and p_decision='approved' and not exists(select 1 from public.claim_evidence where claim_id=p_claim_id) then raise exception 'Scientific approval requires linked test evidence'; end if;
  if p_review_type='compliance' and v_claim.status not in ('compliance_review','approved') then raise exception 'Claim is not in compliance review stage'; end if;
  if p_review_type='compliance' and not exists(select 1 from public.claim_approvals where claim_id=p_claim_id and review_type='scientific' and decision='approved') then raise exception 'Scientific approval required first'; end if;
  insert into public.claim_approvals(claim_id,reviewer_id,review_type,decision,comment) values(p_claim_id,p_actor_id,p_review_type,p_decision,p_comment);
  if p_decision='rejected' then v_next:='rejected';
  elsif p_decision='changes_requested' then v_next:=case when p_review_type='scientific' then 'draft' else 'scientific_review' end;
  elsif p_review_type='scientific' then v_next:='compliance_review';
  else v_next:='approved'; end if;
  update public.claims set status=v_next,updated_at=now() where id=p_claim_id returning * into v_claim;
  perform private.write_audit_actor(p_actor_id,'claim_review','claim',p_claim_id::text,p_review_type||' review: '||p_decision,jsonb_build_object('next_status',v_next));
  return v_claim;
end;$$;
revoke all on function public.server_review_claim(uuid,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.server_review_claim(uuid,text,uuid,text,text,text) to service_role;

create or replace function public.server_publish_claim(p_actor_id uuid,p_actor_role text,p_claim_id uuid)
returns public.claims language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_claim public.claims%rowtype;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_claim from public.claims where id=p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if v_claim.category='health' then raise exception 'Health claims cannot be published'; end if;
  if v_claim.status<>'approved' then raise exception 'Only approved claims can be published'; end if;
  if not exists(select 1 from public.claim_approvals where claim_id=p_claim_id and review_type='scientific' and decision='approved') or not exists(select 1 from public.claim_approvals where claim_id=p_claim_id and review_type='compliance' and decision='approved') then raise exception 'Both scientific and compliance approval required'; end if;
  update public.claims set status='published',updated_at=now() where id=p_claim_id returning * into v_claim;
  perform private.write_audit_actor(p_actor_id,'claim_publish','claim',p_claim_id::text,'Published approved claim');
  return v_claim;
end;$$;
revoke all on function public.server_publish_claim(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.server_publish_claim(uuid,text,uuid) to service_role;

create or replace function public.server_decide_approval(p_actor_id uuid,p_actor_role text,p_approval_id uuid,p_decision text,p_comment text default null)
returns public.approvals language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_row public.approvals%rowtype;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_decision not in ('approved','rejected','changes_requested') then raise exception 'Invalid decision'; end if;
  update public.approvals set status=p_decision,decided_by=p_actor_id,decided_at=now(),decision_comment=nullif(trim(p_comment),'') where id=p_approval_id and status='pending' returning * into v_row;
  if not found then raise exception 'Pending approval not found'; end if;
  perform private.write_audit_actor(p_actor_id,'approval_decision','approval',p_approval_id::text,'Resolved human approval',jsonb_build_object('decision',p_decision));
  return v_row;
end;$$;
revoke all on function public.server_decide_approval(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.server_decide_approval(uuid,text,uuid,text,text) to service_role;

create or replace function public.server_set_agent_configuration(p_actor_id uuid,p_actor_role text,p_agent_id uuid,p_enabled boolean,p_autonomy_level smallint,p_allowed_tools jsonb,p_guardrails jsonb default '{}'::jsonb)
returns public.ai_agents language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_agent public.ai_agents%rowtype; v_tool text;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_autonomy_level not between 1 and 5 then raise exception 'Autonomy level must be 1-5'; end if;
  if jsonb_typeof(coalesce(p_allowed_tools,'[]'::jsonb)) <> 'array' then raise exception 'allowed_tools must be an array'; end if;
  if p_enabled and jsonb_array_length(coalesce(p_allowed_tools,'[]'::jsonb))=0 then raise exception 'Enabled agents require at least one allowed tool'; end if;
  if p_enabled and p_autonomy_level>=4 and p_actor_role<>'founder' then raise exception 'Level 4-5 activation requires founder role'; end if;
  if p_enabled and p_autonomy_level=5 then raise exception 'Level 5 activation is disabled until low-risk workflow certification is implemented'; end if;
  for v_tool in select jsonb_array_elements_text(coalesce(p_allowed_tools,'[]'::jsonb)) loop
    if not exists(select 1 from public.agent_tools where tool_key=v_tool and enabled=true) then raise exception 'Unknown or disabled tool: %',v_tool; end if;
  end loop;
  update public.ai_agents set enabled=p_enabled,autonomy_level=p_autonomy_level,allowed_tools=coalesce(p_allowed_tools,'[]'::jsonb),updated_at=now() where id=p_agent_id returning * into v_agent;
  if not found then raise exception 'Agent not found'; end if;
  insert into public.agent_guardrails(agent_id,max_daily_actions,max_daily_outreach,max_single_spend,max_daily_spend,require_approval_for_external_publish,require_approval_for_money,require_approval_for_claims,allowed_domains,updated_by,updated_at)
  values(p_agent_id,coalesce((p_guardrails->>'max_daily_actions')::int,20),coalesce((p_guardrails->>'max_daily_outreach')::int,0),coalesce((p_guardrails->>'max_single_spend')::numeric,0),coalesce((p_guardrails->>'max_daily_spend')::numeric,0),coalesce((p_guardrails->>'require_approval_for_external_publish')::boolean,true),coalesce((p_guardrails->>'require_approval_for_money')::boolean,true),coalesce((p_guardrails->>'require_approval_for_claims')::boolean,true),coalesce(p_guardrails->'allowed_domains','[]'::jsonb),p_actor_id,now())
  on conflict(agent_id) do update set max_daily_actions=excluded.max_daily_actions,max_daily_outreach=excluded.max_daily_outreach,max_single_spend=excluded.max_single_spend,max_daily_spend=excluded.max_daily_spend,require_approval_for_external_publish=excluded.require_approval_for_external_publish,require_approval_for_money=excluded.require_approval_for_money,require_approval_for_claims=excluded.require_approval_for_claims,allowed_domains=excluded.allowed_domains,updated_by=excluded.updated_by,updated_at=now();
  perform private.write_audit_actor(p_actor_id,'agent_config','ai_agent',p_agent_id::text,'Updated agent configuration',jsonb_build_object('enabled',p_enabled,'autonomy_level',p_autonomy_level,'allowed_tools',p_allowed_tools));
  return v_agent;
end;$$;
revoke all on function public.server_set_agent_configuration(uuid,text,uuid,boolean,smallint,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.server_set_agent_configuration(uuid,text,uuid,boolean,smallint,jsonb,jsonb) to service_role;
