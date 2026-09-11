create or replace function public.cancel_pending_order(p_order_id uuid,p_user_id uuid)
returns public.orders
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare v_order public.orders%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.user_id<>p_user_id then raise exception 'Order not found'; end if;
  if v_order.status<>'pending' then raise exception 'Order is not pending'; end if;

  perform 1 from public.payment_attempts where order_id=p_order_id for update;
  if exists(
    select 1 from public.payment_attempts
    where order_id=p_order_id and (
      provider_order_id is not null
      or provider_payment_id is not null
      or status in ('created','pending','authorized','captured','refunded')
    )
  ) then
    raise exception 'Order has provider payment state that requires reconciliation';
  end if;

  perform p.id
  from public.products p
  join public.order_items oi on oi.product_id=p.id
  where oi.order_id=p_order_id and oi.inventory_reserved_quantity>0
  order by p.id
  for update;

  update public.products p
  set stock_reserved=p.stock_reserved-r.qty,updated_at=now()
  from (
    select product_id,sum(inventory_reserved_quantity)::int qty
    from public.order_items
    where order_id=p_order_id and inventory_reserved_quantity>0
    group by product_id
  ) r
  where p.id=r.product_id;

  update public.order_items set inventory_reserved_quantity=0 where order_id=p_order_id and inventory_reserved_quantity>0;
  update public.orders set status='cancelled',updated_at=now() where id=p_order_id returning * into v_order;
  perform private.write_audit('order_cancelled_by_customer','order',p_order_id::text,'Customer cancelled pending order before any provider order was created; inventory released',jsonb_build_object('user_id',p_user_id));
  return v_order;
end;$$;

revoke all on function public.cancel_pending_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_pending_order(uuid,uuid) to service_role;
