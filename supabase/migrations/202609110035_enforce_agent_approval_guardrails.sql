create or replace function public.set_agent_configuration(p_agent_id uuid, p_enabled boolean, p_autonomy_level smallint, p_allowed_tools jsonb, p_guardrails jsonb default '{}'::jsonb)
returns public.ai_agents
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_agent public.ai_agents%rowtype;
  v_role text := auth.jwt() -> 'app_metadata' ->> 'role';
  v_tool text;
  v_publish_approval boolean := coalesce((p_guardrails->>'require_approval_for_external_publish')::boolean,true);
  v_money_approval boolean := coalesce((p_guardrails->>'require_approval_for_money')::boolean,true);
  v_claims_approval boolean := coalesce((p_guardrails->>'require_approval_for_claims')::boolean,true);
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_autonomy_level not between 1 and 5 then raise exception 'Autonomy level must be 1-5'; end if;
  if jsonb_typeof(coalesce(p_allowed_tools,'[]'::jsonb)) <> 'array' then raise exception 'allowed_tools must be an array'; end if;
  if p_enabled and jsonb_array_length(coalesce(p_allowed_tools,'[]'::jsonb))=0 then raise exception 'Enabled agents require at least one allowed tool'; end if;
  if p_enabled and p_autonomy_level>=4 and v_role<>'founder' then raise exception 'Level 4-5 activation requires founder role'; end if;
  if p_enabled and p_autonomy_level=5 then raise exception 'Level 5 activation is disabled until low-risk workflow certification is implemented'; end if;
  if not v_publish_approval or not v_money_approval or not v_claims_approval then raise exception 'Money, external publishing and claims approval gates cannot be disabled'; end if;
  for v_tool in select jsonb_array_elements_text(coalesce(p_allowed_tools,'[]'::jsonb)) loop
    if not exists(select 1 from public.agent_tools where tool_key=v_tool and enabled=true) then raise exception 'Unknown or disabled tool: %',v_tool; end if;
  end loop;
  update public.ai_agents set enabled=p_enabled,autonomy_level=p_autonomy_level,allowed_tools=coalesce(p_allowed_tools,'[]'::jsonb),updated_at=now() where id=p_agent_id returning * into v_agent;
  if not found then raise exception 'Agent not found'; end if;
  insert into public.agent_guardrails(agent_id,max_daily_actions,max_daily_outreach,max_single_spend,max_daily_spend,require_approval_for_external_publish,require_approval_for_money,require_approval_for_claims,allowed_domains,updated_by,updated_at)
  values(p_agent_id,coalesce((p_guardrails->>'max_daily_actions')::int,20),coalesce((p_guardrails->>'max_daily_outreach')::int,0),coalesce((p_guardrails->>'max_single_spend')::numeric,0),coalesce((p_guardrails->>'max_daily_spend')::numeric,0),true,true,true,coalesce(p_guardrails->'allowed_domains','[]'::jsonb),auth.uid(),now())
  on conflict(agent_id) do update set max_daily_actions=excluded.max_daily_actions,max_daily_outreach=excluded.max_daily_outreach,max_single_spend=excluded.max_single_spend,max_daily_spend=excluded.max_daily_spend,require_approval_for_external_publish=true,require_approval_for_money=true,require_approval_for_claims=true,allowed_domains=excluded.allowed_domains,updated_by=excluded.updated_by,updated_at=now();
  perform private.write_audit('agent_config','ai_agent',p_agent_id::text,'Updated agent configuration',jsonb_build_object('enabled',p_enabled,'autonomy_level',p_autonomy_level,'allowed_tools',p_allowed_tools));
  return v_agent;
end;$$;

create or replace function public.server_set_agent_configuration(p_actor_id uuid,p_actor_role text,p_agent_id uuid,p_enabled boolean,p_autonomy_level smallint,p_allowed_tools jsonb,p_guardrails jsonb default '{}'::jsonb)
returns public.ai_agents
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_agent public.ai_agents%rowtype;
  v_tool text;
  v_publish_approval boolean := coalesce((p_guardrails->>'require_approval_for_external_publish')::boolean,true);
  v_money_approval boolean := coalesce((p_guardrails->>'require_approval_for_money')::boolean,true);
  v_claims_approval boolean := coalesce((p_guardrails->>'require_approval_for_claims')::boolean,true);
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_autonomy_level not between 1 and 5 then raise exception 'Autonomy level must be 1-5'; end if;
  if jsonb_typeof(coalesce(p_allowed_tools,'[]'::jsonb)) <> 'array' then raise exception 'allowed_tools must be an array'; end if;
  if p_enabled and jsonb_array_length(coalesce(p_allowed_tools,'[]'::jsonb))=0 then raise exception 'Enabled agents require at least one allowed tool'; end if;
  if p_enabled and p_autonomy_level>=4 and p_actor_role<>'founder' then raise exception 'Level 4-5 activation requires founder role'; end if;
  if p_enabled and p_autonomy_level=5 then raise exception 'Level 5 activation is disabled until low-risk workflow certification is implemented'; end if;
  if not v_publish_approval or not v_money_approval or not v_claims_approval then raise exception 'Money, external publishing and claims approval gates cannot be disabled'; end if;
  for v_tool in select jsonb_array_elements_text(coalesce(p_allowed_tools,'[]'::jsonb)) loop
    if not exists(select 1 from public.agent_tools where tool_key=v_tool and enabled=true) then raise exception 'Unknown or disabled tool: %',v_tool; end if;
  end loop;
  update public.ai_agents set enabled=p_enabled,autonomy_level=p_autonomy_level,allowed_tools=coalesce(p_allowed_tools,'[]'::jsonb),updated_at=now() where id=p_agent_id returning * into v_agent;
  if not found then raise exception 'Agent not found'; end if;
  insert into public.agent_guardrails(agent_id,max_daily_actions,max_daily_outreach,max_single_spend,max_daily_spend,require_approval_for_external_publish,require_approval_for_money,require_approval_for_claims,allowed_domains,updated_by,updated_at)
  values(p_agent_id,coalesce((p_guardrails->>'max_daily_actions')::int,20),coalesce((p_guardrails->>'max_daily_outreach')::int,0),coalesce((p_guardrails->>'max_single_spend')::numeric,0),coalesce((p_guardrails->>'max_daily_spend')::numeric,0),true,true,true,coalesce(p_guardrails->'allowed_domains','[]'::jsonb),p_actor_id,now())
  on conflict(agent_id) do update set max_daily_actions=excluded.max_daily_actions,max_daily_outreach=excluded.max_daily_outreach,max_single_spend=excluded.max_single_spend,max_daily_spend=excluded.max_daily_spend,require_approval_for_external_publish=true,require_approval_for_money=true,require_approval_for_claims=true,allowed_domains=excluded.allowed_domains,updated_by=excluded.updated_by,updated_at=now();
  perform private.write_audit_actor(p_actor_id,'agent_config','ai_agent',p_agent_id::text,'Updated agent configuration',jsonb_build_object('enabled',p_enabled,'autonomy_level',p_autonomy_level,'allowed_tools',p_allowed_tools));
  return v_agent;
end;$$;

revoke all on function public.set_agent_configuration(uuid,boolean,smallint,jsonb,jsonb) from public,anon;
grant execute on function public.set_agent_configuration(uuid,boolean,smallint,jsonb,jsonb) to authenticated;
revoke all on function public.server_set_agent_configuration(uuid,text,uuid,boolean,smallint,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.server_set_agent_configuration(uuid,text,uuid,boolean,smallint,jsonb,jsonb) to service_role;
