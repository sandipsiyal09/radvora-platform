create or replace function public.submit_support_ticket(
  p_serial_id uuid,
  p_subject text,
  p_message text
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_subject text := trim(coalesce(p_subject,''));
  v_message text := trim(coalesce(p_message,''));
  v_row public.support_tickets%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(v_subject) < 3 or char_length(v_subject) > 160 then raise exception 'Invalid support subject'; end if;
  if char_length(v_message) < 10 or char_length(v_message) > 5000 then raise exception 'Invalid support message'; end if;

  if p_serial_id is not null and not exists (
    select 1 from public.product_registrations pr
    where pr.serial_id = p_serial_id and pr.user_id = v_user
  ) then raise exception 'Registered product not found'; end if;

  if (select count(*) from public.support_tickets where user_id=v_user and created_at >= now()-interval '1 hour') >= 5 then
    raise exception 'Support submission limit reached';
  end if;
  if (select count(*) from public.support_tickets where user_id=v_user and created_at >= now()-interval '24 hours') >= 20 then
    raise exception 'Support daily submission limit reached';
  end if;

  insert into public.support_tickets(user_id,serial_id,subject,message,priority)
  values(v_user,p_serial_id,v_subject,v_message,'normal')
  returning * into v_row;

  perform private.write_audit('support_ticket_submit','support_ticket',v_row.id::text,'Customer submitted support ticket',jsonb_build_object('serial_id',p_serial_id));
  return v_row;
end;
$$;

create or replace function public.submit_warranty_claim(
  p_serial_id uuid,
  p_issue_type text,
  p_description text
)
returns public.warranty_claims
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_issue text := trim(coalesce(p_issue_type,''));
  v_description text := trim(coalesce(p_description,''));
  v_row public.warranty_claims%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_serial_id is null then raise exception 'Registered product required'; end if;
  if v_issue not in ('product_issue','adhesive_issue','physical_damage','other') then raise exception 'Invalid warranty issue type'; end if;
  if char_length(v_description) < 10 or char_length(v_description) > 5000 then raise exception 'Invalid warranty description'; end if;

  if not exists (
    select 1 from public.product_registrations pr
    where pr.serial_id = p_serial_id and pr.user_id = v_user
  ) then raise exception 'Registered product not found'; end if;

  if exists (
    select 1 from public.warranty_claims wc
    where wc.user_id=v_user and wc.serial_id=p_serial_id
      and wc.status in ('submitted','reviewing','approved','replacement_processing')
  ) then raise exception 'An active warranty request already exists for this product'; end if;

  if (select count(*) from public.warranty_claims where user_id=v_user and created_at >= now()-interval '24 hours') >= 3 then
    raise exception 'Warranty submission limit reached';
  end if;

  insert into public.warranty_claims(user_id,serial_id,issue_type,description)
  values(v_user,p_serial_id,v_issue,v_description)
  returning * into v_row;

  perform private.write_audit('warranty_claim_submit','warranty_claim',v_row.id::text,'Customer submitted warranty claim',jsonb_build_object('serial_id',p_serial_id,'issue_type',v_issue));
  return v_row;
end;
$$;

revoke all on function public.submit_support_ticket(uuid,text,text) from public,anon;
revoke all on function public.submit_warranty_claim(uuid,text,text) from public,anon;
grant execute on function public.submit_support_ticket(uuid,text,text) to authenticated;
grant execute on function public.submit_warranty_claim(uuid,text,text) to authenticated;
