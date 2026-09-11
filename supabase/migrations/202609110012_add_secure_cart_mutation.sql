create or replace function public.add_product_to_cart(p_product_id uuid, p_quantity integer default 1)
returns table(cart_id uuid, item_id uuid, quantity integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_cart uuid;
  v_item uuid;
  v_quantity integer;
  v_price numeric;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then
    raise exception 'Invalid quantity';
  end if;

  select price_inr into v_price
  from public.products
  where id = p_product_id and status = 'active' and price_inr is not null and price_inr > 0;

  if v_price is null then
    raise exception 'Product unavailable';
  end if;

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

revoke all on function public.add_product_to_cart(uuid, integer) from public, anon;
grant execute on function public.add_product_to_cart(uuid, integer) to authenticated;
