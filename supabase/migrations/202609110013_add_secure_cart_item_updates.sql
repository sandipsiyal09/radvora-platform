create or replace function public.set_cart_item_quantity(p_item_id uuid, p_quantity integer)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_cart uuid;
  v_quantity integer;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if p_quantity is null or p_quantity < 0 or p_quantity > 50 then
    raise exception 'Invalid quantity';
  end if;

  select ci.cart_id into v_cart
  from public.cart_items ci
  join public.carts c on c.id = ci.cart_id
  where ci.id = p_item_id and c.user_id = v_user and c.status = 'active'
  for update of ci;

  if v_cart is null then
    raise exception 'Cart item not found';
  end if;

  if p_quantity = 0 then
    delete from public.cart_items where id = p_item_id and cart_id = v_cart;
    v_quantity := 0;
  else
    update public.cart_items
    set quantity = p_quantity, updated_at = now()
    where id = p_item_id and cart_id = v_cart
    returning quantity into v_quantity;
  end if;

  update public.carts set updated_at = now() where id = v_cart;
  return v_quantity;
end;
$$;

revoke all on function public.set_cart_item_quantity(uuid, integer) from public, anon;
grant execute on function public.set_cart_item_quantity(uuid, integer) to authenticated;
