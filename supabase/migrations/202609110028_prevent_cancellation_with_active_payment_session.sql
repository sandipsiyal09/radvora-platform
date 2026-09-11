create or replace function public.cancel_pending_order(p_order_id uuid,p_user_id uuid)
returns public.orders language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_order public.orders%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.user_id<>p_user_id then raise exception 'Order not found'; end if;
  if v_order.status<>'pending' then raise exception 'Order is not pending'; end if;

  perform 1 from public.payment_attempts where order_id=p_order_id for update;
  if exists(select 1 from public.payment_attempts where order_id=p_order_id and status in ('created','pending','authorized','captured','refunded')) then
    raise exception 'Order has an active or completed payment state';
  end if;

  update public.orders set status='cancelled',updated_at=now() where id=p_order_id returning * into v_order;
  perform private.write_audit('order_cancelled_by_customer','order',p_order_id::text,'Customer cancelled pending order with no active payment session',jsonb_build_object('user_id',p_user_id));
  return v_order;
end;$$;
revoke all on function public.cancel_pending_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_pending_order(uuid,uuid) to service_role;
