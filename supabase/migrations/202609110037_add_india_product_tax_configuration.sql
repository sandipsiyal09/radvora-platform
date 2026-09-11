alter table public.products
  add column if not exists hsn_code text,
  add column if not exists gst_rate numeric,
  add column if not exists price_inr_includes_gst boolean;

alter table public.products drop constraint if exists products_hsn_code_check;
alter table public.products add constraint products_hsn_code_check check (hsn_code is null or hsn_code ~ '^[0-9]{4,8}$');
alter table public.products drop constraint if exists products_gst_rate_check;
alter table public.products add constraint products_gst_rate_check check (gst_rate is null or (gst_rate >= 0 and gst_rate <= 100));

alter table public.order_items
  add column if not exists hsn_code text,
  add column if not exists gst_rate numeric,
  add column if not exists price_includes_gst boolean,
  add column if not exists line_subtotal numeric,
  add column if not exists tax_amount numeric;

alter table public.order_items drop constraint if exists order_items_hsn_code_check;
alter table public.order_items add constraint order_items_hsn_code_check check (hsn_code is null or hsn_code ~ '^[0-9]{4,8}$');
alter table public.order_items drop constraint if exists order_items_gst_rate_check;
alter table public.order_items add constraint order_items_gst_rate_check check (gst_rate is null or (gst_rate >= 0 and gst_rate <= 100));
alter table public.order_items drop constraint if exists order_items_line_subtotal_check;
alter table public.order_items add constraint order_items_line_subtotal_check check (line_subtotal is null or line_subtotal >= 0);
alter table public.order_items drop constraint if exists order_items_tax_amount_check;
alter table public.order_items add constraint order_items_tax_amount_check check (tax_amount is null or tax_amount >= 0);

create or replace function public.set_product_india_tax_config(
  p_product_id uuid,
  p_hsn_code text,
  p_gst_rate numeric,
  p_price_includes_gst boolean
)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_role text := auth.jwt() -> 'app_metadata' ->> 'role';
  v_product public.products%rowtype;
  v_hsn text := nullif(trim(coalesce(p_hsn_code,'')),'');
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if v_hsn is null or v_hsn !~ '^[0-9]{4,8}$' then raise exception 'HSN must contain 4 to 8 digits'; end if;
  if p_gst_rate is null or p_gst_rate < 0 or p_gst_rate > 100 then raise exception 'GST rate must be between 0 and 100'; end if;
  if p_price_includes_gst is null then raise exception 'Price GST treatment must be explicit'; end if;

  update public.products
  set hsn_code=v_hsn,
      gst_rate=p_gst_rate,
      price_inr_includes_gst=p_price_includes_gst,
      commerce_enabled=false,
      updated_at=now()
  where id=p_product_id
  returning * into v_product;
  if not found then raise exception 'Product not found'; end if;

  perform private.write_audit('product_tax_config','product',p_product_id::text,'Updated India GST/HSN configuration',jsonb_build_object('hsn_code',v_hsn,'gst_rate',p_gst_rate,'price_includes_gst',p_price_includes_gst,'commerce_enabled',false));
  return v_product;
end;$$;
revoke all on function public.set_product_india_tax_config(uuid,text,numeric,boolean) from public,anon;
grant execute on function public.set_product_india_tax_config(uuid,text,numeric,boolean) to authenticated;

create or replace function public.set_product_commerce_enabled(p_product_id uuid, p_enabled boolean)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_role text := auth.jwt() -> 'app_metadata' ->> 'role';
  v_product public.products%rowtype;
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_enabled and (
    v_product.status<>'active'
    or v_product.currency<>'INR'
    or v_product.price_inr is null
    or v_product.price_inr<=0
    or v_product.hsn_code is null
    or v_product.hsn_code !~ '^[0-9]{4,8}$'
    or v_product.gst_rate is null
    or v_product.price_inr_includes_gst is null
  ) then raise exception 'Product is not ready for India commerce: approved price and GST/HSN configuration are required'; end if;
  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit('product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'price_inr',v_product.price_inr,'currency',v_product.currency,'status',v_product.status,'hsn_code',v_product.hsn_code,'gst_rate',v_product.gst_rate,'price_includes_gst',v_product.price_inr_includes_gst));
  return v_product;
end;$$;

create or replace function public.checkout_active_cart_india(
  p_name text,
  p_phone text,
  p_line1 text,
  p_line2 text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_terms_version text
)
returns table(order_id uuid, order_number text, subtotal numeric, total numeric, currency text, checkout_terms_accepted_at timestamptz)
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_cart uuid;
  v_order uuid;
  v_order_number text;
  v_subtotal numeric:=0;
  v_tax numeric:=0;
  v_total numeric:=0;
  v_email text:=auth.jwt()->>'email';
  v_accepted_at timestamptz:=now();
  v_name text:=trim(coalesce(p_name,''));
  v_phone text:=trim(coalesce(p_phone,''));
  v_line1 text:=trim(coalesce(p_line1,''));
  v_line2 text:=nullif(trim(coalesce(p_line2,'')),'');
  v_city text:=trim(coalesce(p_city,''));
  v_state text:=trim(coalesce(p_state,''));
  v_postal text:=trim(coalesce(p_postal_code,''));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_terms_version <> '2026-09-11-india-v1' then raise exception 'Invalid checkout policy version'; end if;
  if char_length(v_name)<2 or char_length(v_name)>120 then raise exception 'Invalid delivery name'; end if;
  if v_phone !~ '^\+91[6-9][0-9]{9}$' then raise exception 'Invalid Indian mobile number'; end if;
  if char_length(v_line1)<5 or char_length(v_line1)>180 then raise exception 'Invalid address line 1'; end if;
  if v_line2 is not null and char_length(v_line2)>180 then raise exception 'Invalid address line 2'; end if;
  if char_length(v_city)<2 or char_length(v_city)>100 then raise exception 'Invalid city'; end if;
  if char_length(v_state)<2 or char_length(v_state)>100 then raise exception 'Invalid state'; end if;
  if v_postal !~ '^[1-9][0-9]{5}$' then raise exception 'Invalid PIN code'; end if;

  select c.id into v_cart from public.carts c where c.user_id=v_user and c.status='active' order by c.created_at desc limit 1 for update;
  if v_cart is null then raise exception 'No active cart'; end if;
  if not exists(select 1 from public.cart_items ci where ci.cart_id=v_cart) then raise exception 'Cart is empty'; end if;
  if exists(
    select 1 from public.cart_items ci join public.products p on p.id=ci.product_id
    where ci.cart_id=v_cart and (
      p.status<>'active' or p.commerce_enabled<>true or p.currency<>'INR' or p.price_inr is null or p.price_inr<=0
      or p.hsn_code is null or p.hsn_code !~ '^[0-9]{4,8}$' or p.gst_rate is null or p.price_inr_includes_gst is null
    )
  ) then raise exception 'One or more cart products are unavailable or missing approved India tax configuration'; end if;

  select
    round(coalesce(sum(case
      when p.price_inr_includes_gst then (ci.quantity*p.price_inr)/(1+(p.gst_rate/100))
      else ci.quantity*p.price_inr
    end),0),2),
    round(coalesce(sum(case
      when p.price_inr_includes_gst then (ci.quantity*p.price_inr)-((ci.quantity*p.price_inr)/(1+(p.gst_rate/100)))
      else (ci.quantity*p.price_inr)*(p.gst_rate/100)
    end),0),2)
  into v_subtotal,v_tax
  from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;
  v_total:=round(v_subtotal+v_tax,2);
  if v_total<=0 then raise exception 'Invalid cart total'; end if;

  v_order_number:='RV-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders(
    user_id,order_number,email,status,currency,subtotal,tax,shipping,total,
    shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,
    checkout_terms_accepted_at,checkout_terms_version
  ) values(
    v_user,v_order_number,v_email,'pending','INR',v_subtotal,v_tax,0,v_total,
    v_name,v_phone,v_line1,v_line2,v_city,v_state,v_postal,'IN',v_accepted_at,p_terms_version
  ) returning id into v_order;

  insert into public.order_items(order_id,product_id,quantity,unit_price,line_subtotal,tax_amount,line_total,hsn_code,gst_rate,price_includes_gst)
  select
    v_order,ci.product_id,ci.quantity,p.price_inr,
    round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)/(1+(p.gst_rate/100)) else ci.quantity*p.price_inr end,2),
    round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)-((ci.quantity*p.price_inr)/(1+(p.gst_rate/100))) else (ci.quantity*p.price_inr)*(p.gst_rate/100) end,2),
    round(case when p.price_inr_includes_gst then ci.quantity*p.price_inr else (ci.quantity*p.price_inr)*(1+(p.gst_rate/100)) end,2),
    p.hsn_code,p.gst_rate,p.price_inr_includes_gst
  from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;

  update public.carts set status='converted',updated_at=now() where id=v_cart;
  perform private.write_audit('checkout_order_create','order',v_order::text,'Customer created India checkout order',jsonb_build_object('cart_id',v_cart,'subtotal',v_subtotal,'tax',v_tax,'total',v_total,'currency','INR','terms_version',p_terms_version));
  return query select o.id,o.order_number,o.subtotal,o.total,o.currency,o.checkout_terms_accepted_at from public.orders o where o.id=v_order;
end;$$;

revoke all on function public.set_product_india_tax_config(uuid,text,numeric,boolean) from public,anon;
grant execute on function public.set_product_india_tax_config(uuid,text,numeric,boolean) to authenticated;
revoke all on function public.set_product_commerce_enabled(uuid,boolean) from public,anon;
grant execute on function public.set_product_commerce_enabled(uuid,boolean) to authenticated;
revoke all on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text) to authenticated;
