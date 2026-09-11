create or replace function public.add_product_to_cart(p_product_id uuid,p_quantity integer default 1)
returns table(cart_id uuid,item_id uuid,quantity integer)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_cart uuid;
  v_item uuid;
  v_existing integer:=0;
  v_new_quantity integer;
  v_price numeric;
  v_available integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity<1 or p_quantity>50 then raise exception 'Invalid quantity'; end if;

  select p.price_inr,(p.stock_on_hand-p.stock_reserved)
  into v_price,v_available
  from public.products p
  where p.id=p_product_id
    and p.status='active'
    and p.commerce_enabled=true
    and p.currency='INR'
    and p.price_inr is not null and p.price_inr>0
    and p.hsn_code is not null and p.gst_rate is not null and p.price_inr_includes_gst is not null
    and p.stock_on_hand is not null
  for update;

  if v_price is null or v_available is null or v_available<1 then raise exception 'Product unavailable'; end if;

  select id into v_cart from public.carts where user_id=v_user and status='active' order by created_at desc limit 1 for update;
  if v_cart is null then
    begin
      insert into public.carts(user_id,status) values(v_user,'active') returning id into v_cart;
    exception when unique_violation then
      select id into v_cart from public.carts where user_id=v_user and status='active' limit 1;
    end;
  end if;

  select ci.id,ci.quantity into v_item,v_existing from public.cart_items ci where ci.cart_id=v_cart and ci.product_id=p_product_id for update;
  v_existing:=coalesce(v_existing,0);
  v_new_quantity:=v_existing+p_quantity;
  if v_new_quantity>50 then raise exception 'Cart quantity limit exceeded'; end if;
  if v_new_quantity>v_available then raise exception 'Requested quantity exceeds available stock'; end if;

  if v_item is null then
    insert into public.cart_items(cart_id,product_id,quantity,unit_price) values(v_cart,p_product_id,v_new_quantity,v_price) returning id into v_item;
  else
    update public.cart_items set quantity=v_new_quantity,unit_price=v_price,updated_at=now() where id=v_item;
  end if;
  update public.carts set updated_at=now() where id=v_cart;
  return query select v_cart,v_item,v_new_quantity;
end;$$;

create or replace function public.set_cart_item_quantity(p_item_id uuid,p_quantity integer)
returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_cart uuid;
  v_product uuid;
  v_available integer;
  v_quantity integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity<0 or p_quantity>50 then raise exception 'Invalid quantity'; end if;

  select ci.cart_id,ci.product_id into v_cart,v_product
  from public.cart_items ci join public.carts c on c.id=ci.cart_id
  where ci.id=p_item_id and c.user_id=v_user and c.status='active'
  for update of ci;
  if v_cart is null then raise exception 'Cart item not found'; end if;

  if p_quantity=0 then
    delete from public.cart_items where id=p_item_id and cart_id=v_cart;
    v_quantity:=0;
  else
    select (p.stock_on_hand-p.stock_reserved) into v_available
    from public.products p
    where p.id=v_product and p.status='active' and p.commerce_enabled=true and p.currency='INR' and p.stock_on_hand is not null
    for update;
    if v_available is null or p_quantity>v_available then raise exception 'Requested quantity exceeds available stock'; end if;
    update public.cart_items set quantity=p_quantity,updated_at=now() where id=p_item_id and cart_id=v_cart returning quantity into v_quantity;
  end if;

  update public.carts set updated_at=now() where id=v_cart;
  return v_quantity;
end;$$;

revoke all on function public.add_product_to_cart(uuid,integer) from public,anon;
grant execute on function public.add_product_to_cart(uuid,integer) to authenticated;
revoke all on function public.set_cart_item_quantity(uuid,integer) from public,anon;
grant execute on function public.set_cart_item_quantity(uuid,integer) to authenticated;
