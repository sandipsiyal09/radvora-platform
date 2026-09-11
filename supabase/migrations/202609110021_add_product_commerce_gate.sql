alter table public.products
  add column if not exists commerce_enabled boolean not null default false;

create or replace function public.set_product_commerce_enabled(p_product_id uuid, p_enabled boolean)
returns public.products
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_role text := auth.jwt() -> 'app_metadata' ->> 'role';
  v_product public.products%rowtype;
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_enabled and (v_product.status<>'active' or v_product.currency<>'INR' or v_product.price_inr is null or v_product.price_inr<=0) then raise exception 'Product is not ready for India commerce'; end if;
  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit('product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'price_inr',v_product.price_inr,'currency',v_product.currency,'status',v_product.status));
  return v_product;
end;
$$;
revoke all on function public.set_product_commerce_enabled(uuid, boolean) from public, anon;
grant execute on function public.set_product_commerce_enabled(uuid, boolean) to authenticated;

create or replace function public.update_product_catalog(p_product_id uuid, p_name text, p_short_description text, p_description text, p_price_inr numeric, p_status text)
returns public.products
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_role text := auth.jwt() -> 'app_metadata' ->> 'role';
  v_product public.products%rowtype;
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_status not in ('draft','active','archived') then raise exception 'Invalid product status'; end if;
  if char_length(trim(coalesce(p_name,''))) < 1 or char_length(trim(p_name)) > 200 then raise exception 'Invalid product name'; end if;
  if p_short_description is not null and char_length(p_short_description) > 500 then raise exception 'Short description is too long'; end if;
  if p_description is not null and char_length(p_description) > 5000 then raise exception 'Description is too long'; end if;
  if p_price_inr is not null and p_price_inr < 0 then raise exception 'Price cannot be negative'; end if;
  update public.products
  set name=trim(p_name),short_description=nullif(trim(p_short_description),''),description=nullif(trim(p_description),''),price_inr=p_price_inr,status=p_status,
      commerce_enabled=case when p_status<>'active' or p_price_inr is null or p_price_inr<=0 or currency<>'INR' then false else commerce_enabled end,
      updated_at=now()
  where id=p_product_id returning * into v_product;
  if not found then raise exception 'Product not found'; end if;
  perform private.write_audit('product_update','product',p_product_id::text,'Updated product catalog record',jsonb_build_object('status',p_status,'price_inr',p_price_inr,'commerce_enabled',v_product.commerce_enabled));
  return v_product;
end;
$$;

create or replace function public.add_product_to_cart(p_product_id uuid, p_quantity integer default 1)
returns table(cart_id uuid, item_id uuid, quantity integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare v_user uuid:=auth.uid(); v_cart uuid; v_item uuid; v_quantity integer; v_price numeric;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity<1 or p_quantity>50 then raise exception 'Invalid quantity'; end if;
  select price_inr into v_price from public.products where id=p_product_id and status='active' and commerce_enabled=true and currency='INR' and price_inr is not null and price_inr>0;
  if v_price is null then raise exception 'Product unavailable'; end if;
  select id into v_cart from public.carts where user_id=v_user and status='active' order by created_at desc limit 1 for update;
  if v_cart is null then
    begin insert into public.carts(user_id,status) values(v_user,'active') returning id into v_cart;
    exception when unique_violation then select id into v_cart from public.carts where user_id=v_user and status='active' limit 1; end;
  end if;
  insert into public.cart_items(cart_id,product_id,quantity,unit_price) values(v_cart,p_product_id,p_quantity,v_price)
  on conflict(cart_id,product_id) do update set quantity=least(50,public.cart_items.quantity+excluded.quantity),unit_price=excluded.unit_price,updated_at=now()
  returning id,public.cart_items.quantity into v_item,v_quantity;
  update public.carts set updated_at=now() where id=v_cart;
  return query select v_cart,v_item,v_quantity;
end;
$$;

create or replace function public.checkout_active_cart()
returns table(order_id uuid, order_number text, subtotal numeric, total numeric, currency text)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare v_user uuid:=auth.uid(); v_cart uuid; v_order uuid; v_order_number text; v_subtotal numeric:=0; v_email text:=auth.jwt()->>'email';
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select c.id into v_cart from public.carts c where c.user_id=v_user and c.status='active' order by c.created_at desc limit 1 for update;
  if v_cart is null then raise exception 'No active cart'; end if;
  if not exists(select 1 from public.cart_items ci where ci.cart_id=v_cart) then raise exception 'Cart is empty'; end if;
  if exists(select 1 from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart and (p.status<>'active' or p.commerce_enabled<>true or p.currency<>'INR' or p.price_inr is null or p.price_inr<=0)) then raise exception 'One or more cart products are unavailable for India checkout'; end if;
  select coalesce(sum(ci.quantity*p.price_inr),0) into v_subtotal from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;
  v_order_number:='RV-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders(user_id,order_number,email,status,currency,subtotal,tax,shipping,total) values(v_user,v_order_number,v_email,'pending','INR',v_subtotal,0,0,v_subtotal) returning id into v_order;
  insert into public.order_items(order_id,product_id,quantity,unit_price,line_total) select v_order,ci.product_id,ci.quantity,p.price_inr,ci.quantity*p.price_inr from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;
  update public.carts set status='converted',updated_at=now() where id=v_cart;
  return query select o.id,o.order_number,o.subtotal,o.total,o.currency from public.orders o where o.id=v_order;
end;
$$;
