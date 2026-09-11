create or replace function public.add_product_to_cart(p_product_id uuid, p_quantity integer default 1)
returns table(cart_id uuid, item_id uuid, quantity integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_cart uuid;
  v_item uuid;
  v_quantity integer;
  v_price numeric;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then raise exception 'Invalid quantity'; end if;

  select price_inr into v_price
  from public.products
  where id = p_product_id
    and status = 'active'
    and currency = 'INR'
    and price_inr is not null
    and price_inr > 0;

  if v_price is null then raise exception 'Product unavailable'; end if;

  select id into v_cart
  from public.carts
  where user_id = v_user and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if v_cart is null then
    begin
      insert into public.carts(user_id, status) values (v_user, 'active') returning id into v_cart;
    exception when unique_violation then
      select id into v_cart from public.carts where user_id = v_user and status = 'active' limit 1;
    end;
  end if;

  insert into public.cart_items(cart_id, product_id, quantity, unit_price)
  values (v_cart, p_product_id, p_quantity, v_price)
  on conflict (cart_id, product_id) do update
    set quantity = least(50, public.cart_items.quantity + excluded.quantity),
        unit_price = excluded.unit_price,
        updated_at = now()
  returning id, public.cart_items.quantity into v_item, v_quantity;

  update public.carts set updated_at = now() where id = v_cart;
  return query select v_cart, v_item, v_quantity;
end;
$$;

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
  v_email text := auth.jwt() ->> 'email';
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select c.id into v_cart
  from public.carts c
  where c.user_id = v_user and c.status = 'active'
  order by c.created_at desc
  limit 1
  for update;

  if v_cart is null then raise exception 'No active cart'; end if;
  if not exists (select 1 from public.cart_items ci where ci.cart_id = v_cart) then raise exception 'Cart is empty'; end if;

  if exists (
    select 1 from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart
      and (p.status <> 'active' or p.currency <> 'INR' or p.price_inr is null or p.price_inr <= 0)
  ) then
    raise exception 'One or more cart products are unavailable for India checkout';
  end if;

  select coalesce(sum(ci.quantity * p.price_inr),0) into v_subtotal
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart;

  v_order_number := 'RV-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.orders(user_id, order_number, email, status, currency, subtotal, tax, shipping, total)
  values (v_user, v_order_number, v_email, 'pending', 'INR', v_subtotal, 0, 0, v_subtotal)
  returning id into v_order;

  insert into public.order_items(order_id, product_id, quantity, unit_price, line_total)
  select v_order, ci.product_id, ci.quantity, p.price_inr, ci.quantity * p.price_inr
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart;

  update public.carts set status='converted', updated_at=now() where id=v_cart;

  return query select o.id, o.order_number, o.subtotal, o.total, o.currency from public.orders o where o.id=v_order;
end;
$$;
