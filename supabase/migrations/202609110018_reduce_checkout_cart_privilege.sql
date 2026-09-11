create or replace function public.checkout_active_cart()
returns table(order_id uuid, order_number text, subtotal numeric, total numeric, currency text)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_cart uuid;
  v_order uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_currency text := 'INR';
  v_email text := auth.jwt() ->> 'email';
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select c.id into v_cart
  from public.carts c
  where c.user_id = v_user and c.status = 'active'
  order by c.created_at desc
  limit 1
  for update;

  if v_cart is null then
    raise exception 'No active cart';
  end if;

  if not exists (select 1 from public.cart_items ci where ci.cart_id = v_cart) then
    raise exception 'Cart is empty';
  end if;

  if exists (
    select 1
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart and (p.status <> 'active' or p.price_inr is null or p.price_inr <= 0)
  ) then
    raise exception 'One or more cart products are unavailable for checkout';
  end if;

  select coalesce(sum(ci.quantity * p.price_inr),0), min(p.currency)
    into v_subtotal, v_currency
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart;

  v_order_number := 'RV-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.orders(user_id, order_number, email, status, currency, subtotal, tax, shipping, total)
  values (v_user, v_order_number, v_email, 'pending', coalesce(v_currency,'INR'), v_subtotal, 0, 0, v_subtotal)
  returning id into v_order;

  insert into public.order_items(order_id, product_id, quantity, unit_price, line_total)
  select v_order, ci.product_id, ci.quantity, p.price_inr, ci.quantity * p.price_inr
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart;

  update public.carts set status='converted', updated_at=now() where id=v_cart;

  return query
  select o.id, o.order_number, o.subtotal, o.total, o.currency
  from public.orders o where o.id=v_order;
end;
$$;
