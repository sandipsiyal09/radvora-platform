alter table public.refund_attempts add column if not exists submission_started_at timestamptz;

alter table public.refund_attempts drop constraint if exists refund_attempts_status_check;
alter table public.refund_attempts add constraint refund_attempts_status_check check (status in ('requested','submitting','pending','processed','failed'));

drop index if exists public.refund_attempts_one_active_per_order;
create unique index refund_attempts_one_active_per_order on public.refund_attempts(order_id) where status in ('requested','submitting','pending');

create or replace function public.claim_razorpay_refund_submission(p_refund_attempt_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_status text; v_started timestamptz; v_now timestamptz := now();
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select status, submission_started_at into v_status, v_started
  from public.refund_attempts where id=p_refund_attempt_id for update;
  if not found then raise exception 'Refund attempt not found'; end if;
  if v_status='requested' or (v_status='submitting' and (v_started is null or v_started < v_now - interval '5 minutes')) then
    update public.refund_attempts set status='submitting', submission_started_at=v_now, updated_at=v_now where id=p_refund_attempt_id;
    return true;
  end if;
  return false;
end;$$;
revoke all on function public.claim_razorpay_refund_submission(uuid) from public,anon,authenticated;
grant execute on function public.claim_razorpay_refund_submission(uuid) to service_role;
