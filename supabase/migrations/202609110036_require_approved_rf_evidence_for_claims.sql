create or replace function public.review_claim(p_claim_id uuid, p_review_type text, p_decision text, p_comment text default null)
returns public.claims
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare v_claim public.claims%rowtype; v_next text;
begin
  if not private.is_radvora_admin() then raise exception 'Admin access required'; end if;
  if p_review_type not in ('scientific','compliance') then raise exception 'Invalid review type'; end if;
  if p_decision not in ('approved','rejected','changes_requested') then raise exception 'Invalid decision'; end if;
  select * into v_claim from public.claims where id=p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if v_claim.category='health' and p_decision='approved' then raise exception 'Health claims cannot be approved in this workflow'; end if;
  if p_review_type='scientific' and v_claim.status not in ('draft','scientific_review') then raise exception 'Claim is not in scientific review stage'; end if;
  if p_review_type='scientific' and p_decision='approved' and not exists(
    select 1 from public.claim_evidence ce join public.rf_tests t on t.id=ce.rf_test_id
    where ce.claim_id=p_claim_id and t.status in ('approved','published')
  ) then raise exception 'Scientific approval requires linked approved RF test evidence'; end if;
  if p_review_type='compliance' and v_claim.status not in ('compliance_review','approved') then raise exception 'Claim is not in compliance review stage'; end if;
  if p_review_type='compliance' and not exists(select 1 from public.claim_approvals where claim_id=p_claim_id and review_type='scientific' and decision='approved') then raise exception 'Scientific approval required first'; end if;
  insert into public.claim_approvals(claim_id,reviewer_id,review_type,decision,comment) values(p_claim_id,auth.uid(),p_review_type,p_decision,p_comment);
  if p_decision='rejected' then v_next:='rejected';
  elsif p_decision='changes_requested' then v_next:=case when p_review_type='scientific' then 'draft' else 'scientific_review' end;
  elsif p_review_type='scientific' then v_next:='compliance_review';
  else v_next:='approved'; end if;
  update public.claims set status=v_next,updated_at=now() where id=p_claim_id returning * into v_claim;
  perform private.write_audit('claim_review','claim',p_claim_id::text,p_review_type||' review: '||p_decision,jsonb_build_object('next_status',v_next));
  return v_claim;
end;$$;

create or replace function public.publish_claim(p_claim_id uuid)
returns public.claims
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare v_claim public.claims%rowtype;
begin
  if not private.is_radvora_admin() then raise exception 'Admin access required'; end if;
  select * into v_claim from public.claims where id=p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;
  if v_claim.category='health' then raise exception 'Health claims cannot be published'; end if;
  if v_claim.status<>'approved' then raise exception 'Only approved claims can be published'; end if;
  if not exists(select 1 from public.claim_approvals where claim_id=p_claim_id and review_type='scientific' and decision='approved') or not exists(select 1 from public.claim_approvals where claim_id=p_claim_id and review_type='compliance' and decision='approved') then raise exception 'Both scientific and compliance approval required'; end if;
  if not exists(
    select 1 from public.claim_evidence ce join public.rf_tests t on t.id=ce.rf_test_id
    where ce.claim_id=p_claim_id and t.status in ('approved','published')
  ) then raise exception 'Approved RF test evidence required for publication'; end if;
  update public.claims set status='published',updated_at=now() where id=p_claim_id returning * into v_claim;
  perform private.write_audit('claim_publish','claim',p_claim_id::text,'Published approved claim');
  return v_claim;
end;$$;

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
  if p_review_type='scientific' and p_decision='approved' and not exists(
    select 1 from public.claim_evidence ce join public.rf_tests t on t.id=ce.rf_test_id
    where ce.claim_id=p_claim_id and t.status in ('approved','published')
  ) then raise exception 'Scientific approval requires linked approved RF test evidence'; end if;
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
  if not exists(
    select 1 from public.claim_evidence ce join public.rf_tests t on t.id=ce.rf_test_id
    where ce.claim_id=p_claim_id and t.status in ('approved','published')
  ) then raise exception 'Approved RF test evidence required for publication'; end if;
  update public.claims set status='published',updated_at=now() where id=p_claim_id returning * into v_claim;
  perform private.write_audit_actor(p_actor_id,'claim_publish','claim',p_claim_id::text,'Published approved claim');
  return v_claim;
end;$$;

revoke all on function public.review_claim(uuid,text,text,text) from public,anon;
grant execute on function public.review_claim(uuid,text,text,text) to authenticated;
revoke all on function public.publish_claim(uuid) from public,anon;
grant execute on function public.publish_claim(uuid) to authenticated;
revoke all on function public.server_review_claim(uuid,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.server_review_claim(uuid,text,uuid,text,text,text) to service_role;
revoke all on function public.server_publish_claim(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.server_publish_claim(uuid,text,uuid) to service_role;
