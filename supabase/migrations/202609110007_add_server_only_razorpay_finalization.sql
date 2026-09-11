create or replace function public.finalize_razorpay_payment(
  p_order_id uuid,
  p_attempt_id uuid,
  p_payment_id text
)
returns public.orders
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'Order not found'; end if;

  select * into v_attempt
  from public.payment_attempts
  where id = p_attempt_id
    and order_id = p_order_id
    and provider = 'razorpay'
  for update;

  if not found then raise exception 'Payment attempt not found'; end if;

  if v_order.currency <> 'INR' or v_attempt.currency <> 'INR' then
    raise exception 'Only INR payments can be finalized';
  end if;

  if v_attempt.amount <> v_order.total then
    raise exception 'Payment amount does not match order total';
  end if;

  if v_order.status <> 'pending' then
    if v_order.status in ('paid','processing','shipped','delivered')
       and v_attempt.status = 'captured'
       and v_attempt.provider_payment_id = p_payment_id then
      return v_order;
    end if;
    raise exception 'Order is not pending';
  end if;

  if v_attempt.status <> 'pending' then
    raise exception 'Payment attempt is not pending';
  end if;

  update public.payment_attempts
  set status = 'captured',
      provider_payment_id = p_payment_id,
      failure_code = null,
      updated_at = now()
  where id = p_attempt_id;

  update public.orders
  set status = 'paid',
      payment_provider = 'razorpay',
      payment_reference = p_payment_id,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.finalize_razorpay_payment(uuid,uuid,text) from public;
revoke execute on function public.finalize_razorpay_payment(uuid,uuid,text) from anon, authenticated;
grant execute on function public.finalize_razorpay_payment(uuid,uuid,text) to service_role;
