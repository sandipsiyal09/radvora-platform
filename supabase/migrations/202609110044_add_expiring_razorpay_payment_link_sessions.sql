alter table public.payment_attempts
  add column if not exists provider_session_id text,
  add column if not exists provider_session_url text,
  add column if not exists provider_session_expires_at timestamptz;

create unique index if not exists payment_attempts_provider_session_unique
  on public.payment_attempts(provider,provider_session_id)
  where provider_session_id is not null;

alter table public.payment_attempts drop constraint if exists payment_attempts_provider_session_id_length;
alter table public.payment_attempts add constraint payment_attempts_provider_session_id_length check (provider_session_id is null or char_length(provider_session_id)<=200);
alter table public.payment_attempts drop constraint if exists payment_attempts_provider_session_url_length;
alter table public.payment_attempts add constraint payment_attempts_provider_session_url_length check (provider_session_url is null or char_length(provider_session_url)<=1000);

create or replace function public.close_razorpay_payment_link_attempt(
  p_attempt_id uuid,
  p_session_id text,
  p_reason text
)
returns public.orders
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_order public.orders%rowtype;
  v_reason text:=case when p_reason in ('payment_link_cancelled','payment_link_expired') then p_reason else null end;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if v_reason is null then raise exception 'Invalid close reason'; end if;
  if p_session_id is null or char_length(trim(p_session_id))<3 then raise exception 'Invalid payment link identifier'; end if;

  select * into v_attempt
  from public.payment_attempts
  where id=p_attempt_id and provider='razorpay'
  for update;
  if not found then raise exception 'Payment attempt not found'; end if;
  if v_attempt.provider_session_id<>p_session_id then raise exception 'Payment link mismatch'; end if;

  select * into v_order from public.orders where id=v_attempt.order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if v_order.status='cancelled' and v_attempt.status='failed' then return v_order; end if;
  if v_order.status<>'pending' then raise exception 'Order is not pending'; end if;
  if v_attempt.provider_payment_id is not null or v_attempt.status in ('authorized','captured','refunded') then raise exception 'Payment state cannot be released'; end if;

  perform p.id
  from public.products p
  join public.order_items oi on oi.product_id=p.id
  where oi.order_id=v_order.id and oi.inventory_reserved_quantity>0
  order by p.id
  for update;

  update public.products p
  set stock_reserved=p.stock_reserved-r.qty,updated_at=now()
  from (
    select product_id,sum(inventory_reserved_quantity)::int qty
    from public.order_items
    where order_id=v_order.id and inventory_reserved_quantity>0
    group by product_id
  ) r
  where p.id=r.product_id;

  update public.order_items set inventory_reserved_quantity=0 where order_id=v_order.id and inventory_reserved_quantity>0;
  update public.payment_attempts set status='failed',failure_code=v_reason,updated_at=now() where id=v_attempt.id;
  update public.orders set status='cancelled',updated_at=now() where id=v_order.id returning * into v_order;

  perform private.write_audit('payment_link_closed','order',v_order.id::text,'Razorpay Payment Link closed before payment; reservation released',jsonb_build_object('payment_attempt_id',v_attempt.id,'provider_session_id',p_session_id,'reason',v_reason));
  return v_order;
end;$$;

revoke all on function public.close_razorpay_payment_link_attempt(uuid,text,text) from public,anon,authenticated;
grant execute on function public.close_razorpay_payment_link_attempt(uuid,text,text) to service_role;
