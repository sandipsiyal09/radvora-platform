create or replace function public.finalize_razorpay_payment(
  p_order_id uuid,
  p_attempt_id uuid,
  p_payment_id text
)
returns public.orders
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_line_subtotal numeric;
  v_line_tax numeric;
  v_line_total numeric;
  v_item_count integer;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_payment_id is null or char_length(trim(p_payment_id))<3 or char_length(p_payment_id)>200 then raise exception 'Invalid payment identifier'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  select * into v_attempt
  from public.payment_attempts
  where id=p_attempt_id and order_id=p_order_id and provider='razorpay'
  for update;
  if not found then raise exception 'Payment attempt not found'; end if;

  if v_order.currency<>'INR' or v_attempt.currency<>'INR' then raise exception 'Only INR payments can be finalized'; end if;
  if v_attempt.amount<>v_order.total then raise exception 'Payment amount does not match order total'; end if;

  if v_order.status<>'pending' then
    if v_order.status in ('paid','processing','shipped','delivered') and v_attempt.status='captured' and v_attempt.provider_payment_id=p_payment_id then return v_order; end if;
    raise exception 'Order is not pending';
  end if;
  if v_attempt.status<>'pending' then raise exception 'Payment attempt is not pending'; end if;

  select count(*),coalesce(sum(line_subtotal),0),coalesce(sum(tax_amount),0),coalesce(sum(line_total),0)
  into v_item_count,v_line_subtotal,v_line_tax,v_line_total
  from public.order_items
  where order_id=p_order_id;

  if v_item_count<1 then raise exception 'Order has no items'; end if;
  if exists(
    select 1 from public.order_items
    where order_id=p_order_id and (
      line_subtotal is null or tax_amount is null or hsn_code is null or gst_rate is null or price_includes_gst is null
      or inventory_reserved_quantity<>quantity or inventory_reserved_quantity<=0
    )
  ) then raise exception 'Order tax or inventory reservation state is incomplete'; end if;

  v_line_subtotal:=round(v_line_subtotal,2);
  v_line_tax:=round(v_line_tax,2);
  v_line_total:=round(v_line_total,2);
  if abs(v_line_subtotal-v_order.subtotal)>0.01 or abs(v_line_tax-v_order.tax)>0.01 or abs((v_line_total+v_order.shipping)-v_order.total)>0.01 then
    raise exception 'Order accounting does not reconcile';
  end if;

  update public.payment_attempts set status='captured',provider_payment_id=p_payment_id,failure_code=null,updated_at=now() where id=p_attempt_id;
  update public.orders set status='paid',payment_provider='razorpay',payment_reference=p_payment_id,updated_at=now() where id=p_order_id returning * into v_order;
  perform private.write_audit('order_payment_captured','order',p_order_id::text,'Razorpay payment finalized after tax and inventory reconciliation',jsonb_build_object('payment_attempt_id',p_attempt_id,'provider_payment_id',p_payment_id,'total',v_order.total,'currency',v_order.currency));
  return v_order;
end;$$;

revoke all on function public.finalize_razorpay_payment(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.finalize_razorpay_payment(uuid,uuid,text) to service_role;
