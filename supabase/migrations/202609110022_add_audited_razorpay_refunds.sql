create table if not exists public.refund_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_attempt_id uuid not null references public.payment_attempts(id) on delete restrict,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_refund_id text,
  amount numeric not null check (amount > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'requested' check (status in ('requested','pending','processed','failed')),
  reason text not null check (char_length(reason) between 5 and 500),
  requested_by uuid not null references auth.users(id) on delete restrict,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists refund_attempts_provider_refund_unique on public.refund_attempts(provider,provider_refund_id) where provider_refund_id is not null;
create unique index if not exists refund_attempts_one_active_per_order on public.refund_attempts(order_id) where status in ('requested','pending');
create index if not exists idx_refund_attempts_order on public.refund_attempts(order_id,created_at desc);

alter table public.refund_attempts enable row level security;
create policy refund_attempts_read_owner_or_admin on public.refund_attempts for select to authenticated using (
  exists (select 1 from public.orders o where o.id=refund_attempts.order_id and (o.user_id=auth.uid() or (auth.jwt()->'app_metadata'->>'role') in ('admin','founder')))
);
revoke all on public.refund_attempts from anon, authenticated;
grant select on public.refund_attempts to authenticated;
grant all on public.refund_attempts to service_role;

create or replace function public.finalize_razorpay_refund(p_refund_attempt_id uuid,p_provider_refund_id text,p_status text,p_failure_code text default null)
returns void language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_refund public.refund_attempts%rowtype; v_payment public.payment_attempts%rowtype; v_order public.orders%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_status not in ('pending','processed','failed') then raise exception 'Invalid refund status'; end if;
  select * into v_refund from public.refund_attempts where id=p_refund_attempt_id for update;
  if not found then raise exception 'Refund attempt not found'; end if;
  select * into v_payment from public.payment_attempts where id=v_refund.payment_attempt_id for update;
  if not found or v_payment.order_id<>v_refund.order_id or v_payment.provider<>'razorpay' then raise exception 'Payment reconciliation failed'; end if;
  select * into v_order from public.orders where id=v_refund.order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_refund.status='processed' then return; end if;
  if p_status='processed' then
    if v_payment.status<>'captured' or v_payment.provider_payment_id is null then raise exception 'Payment is not captured'; end if;
    if v_refund.amount<>v_payment.amount or v_refund.currency<>v_payment.currency or v_refund.amount<>v_order.total or v_refund.currency<>v_order.currency then raise exception 'Refund amount mismatch'; end if;
    if v_order.status not in ('paid','processing') then raise exception 'Order is not refundable'; end if;
    update public.refund_attempts set provider_refund_id=p_provider_refund_id,status='processed',failure_code=null,processed_at=now(),updated_at=now() where id=v_refund.id;
    update public.payment_attempts set status='refunded',updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    perform private.write_audit('order_refund_processed','order',v_order.id::text,'Full Razorpay refund processed',jsonb_build_object('refund_attempt_id',v_refund.id,'provider_refund_id',p_provider_refund_id,'amount',v_refund.amount,'currency',v_refund.currency));
  elsif p_status='pending' then
    update public.refund_attempts set provider_refund_id=p_provider_refund_id,status='pending',failure_code=null,updated_at=now() where id=v_refund.id;
  else
    update public.refund_attempts set provider_refund_id=coalesce(p_provider_refund_id,provider_refund_id),status='failed',failure_code=left(coalesce(p_failure_code,'refund_failed'),120),updated_at=now() where id=v_refund.id;
  end if;
end;$$;
revoke all on function public.finalize_razorpay_refund(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finalize_razorpay_refund(uuid,text,text,text) to service_role;
