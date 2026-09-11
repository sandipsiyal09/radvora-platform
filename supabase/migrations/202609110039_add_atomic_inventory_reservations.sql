alter table public.products
  add column if not exists stock_on_hand integer,
  add column if not exists stock_reserved integer not null default 0;

alter table public.products drop constraint if exists products_stock_on_hand_check;
alter table public.products add constraint products_stock_on_hand_check check (stock_on_hand is null or stock_on_hand >= 0);
alter table public.products drop constraint if exists products_stock_reserved_check;
alter table public.products add constraint products_stock_reserved_check check (stock_reserved >= 0 and (stock_on_hand is null or stock_reserved <= stock_on_hand));

alter table public.order_items add column if not exists inventory_reserved_quantity integer not null default 0;
alter table public.order_items drop constraint if exists order_items_inventory_reserved_quantity_check;
alter table public.order_items add constraint order_items_inventory_reserved_quantity_check check (inventory_reserved_quantity >= 0 and inventory_reserved_quantity <= quantity);

create or replace function public.set_product_inventory(p_product_id uuid,p_stock_on_hand integer)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_role text:=auth.jwt()->'app_metadata'->>'role';
  v_product public.products%rowtype;
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_stock_on_hand is null or p_stock_on_hand < 0 then raise exception 'Stock on hand must be zero or greater'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_stock_on_hand < v_product.stock_reserved then raise exception 'Stock on hand cannot be below reserved quantity'; end if;
  update public.products set stock_on_hand=p_stock_on_hand,commerce_enabled=false,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit('product_inventory_update','product',p_product_id::text,'Updated governed stock on hand',jsonb_build_object('stock_on_hand',p_stock_on_hand,'stock_reserved',v_product.stock_reserved,'commerce_enabled',false));
  return v_product;
end;$$;
revoke all on function public.set_product_inventory(uuid,integer) from public,anon;
grant execute on function public.set_product_inventory(uuid,integer) to authenticated;

create or replace function public.set_product_commerce_enabled(p_product_id uuid,p_enabled boolean)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_role text:=auth.jwt()->'app_metadata'->>'role';
  v_product public.products%rowtype;
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_enabled and (
    v_product.status<>'active' or v_product.currency<>'INR' or v_product.price_inr is null or v_product.price_inr<=0
    or v_product.hsn_code is null or v_product.hsn_code !~ '^[0-9]{4,8}$' or v_product.gst_rate is null or v_product.price_inr_includes_gst is null
    or v_product.stock_on_hand is null or (v_product.stock_on_hand-v_product.stock_reserved)<=0
  ) then raise exception 'Product is not ready for India commerce: approved price, GST/HSN and available inventory are required'; end if;
  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit('product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'stock_on_hand',v_product.stock_on_hand,'stock_reserved',v_product.stock_reserved));
  return v_product;
end;$$;

create or replace function public.checkout_active_cart_india(
  p_name text,p_phone text,p_line1 text,p_line2 text,p_city text,p_state text,p_postal_code text,p_terms_version text
)
returns table(order_id uuid,order_number text,subtotal numeric,total numeric,currency text,checkout_terms_accepted_at timestamptz)
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_user uuid:=auth.uid();v_cart uuid;v_order uuid;v_order_number text;v_subtotal numeric:=0;v_tax numeric:=0;v_total numeric:=0;
  v_email text:=auth.jwt()->>'email';v_accepted_at timestamptz:=now();v_name text:=trim(coalesce(p_name,''));v_phone text:=trim(coalesce(p_phone,''));
  v_line1 text:=trim(coalesce(p_line1,''));v_line2 text:=nullif(trim(coalesce(p_line2,'')),'');v_city text:=trim(coalesce(p_city,''));v_state text:=trim(coalesce(p_state,''));v_postal text:=trim(coalesce(p_postal_code,''));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_terms_version<>'2026-09-11-india-v1' then raise exception 'Invalid checkout policy version'; end if;
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

  perform p.id from public.products p join public.cart_items ci on ci.product_id=p.id where ci.cart_id=v_cart order by p.id for update;

  if exists(
    select 1 from public.cart_items ci join public.products p on p.id=ci.product_id
    where ci.cart_id=v_cart and (
      p.status<>'active' or p.commerce_enabled<>true or p.currency<>'INR' or p.price_inr is null or p.price_inr<=0
      or p.hsn_code is null or p.hsn_code !~ '^[0-9]{4,8}$' or p.gst_rate is null or p.price_inr_includes_gst is null
      or p.stock_on_hand is null or ci.quantity>(p.stock_on_hand-p.stock_reserved)
    )
  ) then raise exception 'One or more cart products are unavailable, tax-unconfigured or out of stock'; end if;

  select coalesce(sum(x.line_subtotal),0),coalesce(sum(x.tax_amount),0) into v_subtotal,v_tax
  from (
    select round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)/(1+(p.gst_rate/100)) else ci.quantity*p.price_inr end,2) line_subtotal,
           round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)-((ci.quantity*p.price_inr)/(1+(p.gst_rate/100))) else (ci.quantity*p.price_inr)*(p.gst_rate/100) end,2) tax_amount
    from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart
  ) x;
  v_subtotal:=round(v_subtotal,2);v_tax:=round(v_tax,2);v_total:=round(v_subtotal+v_tax,2);
  if v_total<=0 then raise exception 'Invalid cart total'; end if;

  v_order_number:='RV-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders(user_id,order_number,email,status,currency,subtotal,tax,shipping,total,shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,checkout_terms_accepted_at,checkout_terms_version)
  values(v_user,v_order_number,v_email,'pending','INR',v_subtotal,v_tax,0,v_total,v_name,v_phone,v_line1,v_line2,v_city,v_state,v_postal,'IN',v_accepted_at,p_terms_version) returning id into v_order;

  insert into public.order_items(order_id,product_id,quantity,unit_price,line_subtotal,tax_amount,line_total,hsn_code,gst_rate,price_includes_gst,inventory_reserved_quantity)
  select v_order,ci.product_id,ci.quantity,p.price_inr,
    round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)/(1+(p.gst_rate/100)) else ci.quantity*p.price_inr end,2),
    round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)-((ci.quantity*p.price_inr)/(1+(p.gst_rate/100))) else (ci.quantity*p.price_inr)*(p.gst_rate/100) end,2),
    round(case when p.price_inr_includes_gst then ci.quantity*p.price_inr else (ci.quantity*p.price_inr)*(1+(p.gst_rate/100)) end,2),
    p.hsn_code,p.gst_rate,p.price_inr_includes_gst,ci.quantity
  from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;

  update public.products p set stock_reserved=p.stock_reserved+r.qty,updated_at=now()
  from (select ci.product_id,sum(ci.quantity)::int qty from public.cart_items ci where ci.cart_id=v_cart group by ci.product_id) r
  where p.id=r.product_id;

  update public.carts set status='converted',updated_at=now() where id=v_cart;
  perform private.write_audit('checkout_order_create','order',v_order::text,'Customer created India checkout order with inventory reservation',jsonb_build_object('cart_id',v_cart,'subtotal',v_subtotal,'tax',v_tax,'total',v_total,'currency','INR'));
  return query select o.id,o.order_number,o.subtotal,o.total,o.currency,o.checkout_terms_accepted_at from public.orders o where o.id=v_order;
end;$$;

create or replace function public.cancel_pending_order(p_order_id uuid,p_user_id uuid)
returns public.orders language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_order public.orders%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.user_id<>p_user_id then raise exception 'Order not found'; end if;
  if v_order.status<>'pending' then raise exception 'Order is not pending'; end if;
  perform 1 from public.payment_attempts where order_id=p_order_id for update;
  if exists(select 1 from public.payment_attempts where order_id=p_order_id and status in ('created','pending','authorized','captured','refunded')) then raise exception 'Order has an active or completed payment state'; end if;
  perform p.id from public.products p join public.order_items oi on oi.product_id=p.id where oi.order_id=p_order_id and oi.inventory_reserved_quantity>0 order by p.id for update;
  update public.products p set stock_reserved=p.stock_reserved-r.qty,updated_at=now()
  from (select product_id,sum(inventory_reserved_quantity)::int qty from public.order_items where order_id=p_order_id group by product_id) r
  where p.id=r.product_id;
  update public.order_items set inventory_reserved_quantity=0 where order_id=p_order_id and inventory_reserved_quantity>0;
  update public.orders set status='cancelled',updated_at=now() where id=p_order_id returning * into v_order;
  perform private.write_audit('order_cancelled_by_customer','order',p_order_id::text,'Customer cancelled pending order and inventory reservation was released',jsonb_build_object('user_id',p_user_id));
  return v_order;
end;$$;
revoke all on function public.cancel_pending_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_pending_order(uuid,uuid) to service_role;

create or replace function public.finalize_razorpay_refund(p_refund_attempt_id uuid,p_provider_refund_id text,p_status text,p_failure_code text default null)
returns void language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_refund public.refund_attempts%rowtype;v_payment public.payment_attempts%rowtype;v_order public.orders%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_status not in ('pending','processed','failed') then raise exception 'Invalid refund status'; end if;
  select * into v_refund from public.refund_attempts where id=p_refund_attempt_id for update;
  if not found then raise exception 'Refund attempt not found'; end if;
  select * into v_payment from public.payment_attempts where id=v_refund.payment_attempt_id for update;
  if not found or v_payment.order_id<>v_refund.order_id or v_payment.provider<>'razorpay' then raise exception 'Payment reconciliation failed'; end if;
  select * into v_order from public.orders where id=v_refund.order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_refund.status='processed' then return; end if;
  if p_status='processed' then
    if v_payment.status<>'captured' or v_payment.provider_payment_id is null then raise exception 'Payment is not captured'; end if;
    if v_refund.amount<>v_payment.amount or v_refund.currency<>v_payment.currency or v_refund.amount<>v_order.total or v_refund.currency<>v_order.currency then raise exception 'Refund amount mismatch'; end if;
    if v_order.status not in ('paid','processing') then raise exception 'Order is not refundable'; end if;
    perform p.id from public.products p join public.order_items oi on oi.product_id=p.id where oi.order_id=v_order.id and oi.inventory_reserved_quantity>0 order by p.id for update;
    update public.products p set stock_reserved=p.stock_reserved-r.qty,updated_at=now()
    from (select product_id,sum(inventory_reserved_quantity)::int qty from public.order_items where order_id=v_order.id group by product_id) r
    where p.id=r.product_id;
    update public.order_items set inventory_reserved_quantity=0 where order_id=v_order.id and inventory_reserved_quantity>0;
    update public.refund_attempts set provider_refund_id=p_provider_refund_id,status='processed',failure_code=null,processed_at=now(),updated_at=now() where id=v_refund.id;
    update public.payment_attempts set status='refunded',updated_at=now() where id=v_payment.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    perform private.write_audit('order_refund_processed','order',v_order.id::text,'Full Razorpay refund processed and unshipped inventory released',jsonb_build_object('refund_attempt_id',v_refund.id,'provider_refund_id',p_provider_refund_id,'amount',v_refund.amount,'currency',v_refund.currency));
  elsif p_status='pending' then
    update public.refund_attempts set provider_refund_id=p_provider_refund_id,status='pending',failure_code=null,updated_at=now() where id=v_refund.id;
  else
    update public.refund_attempts set provider_refund_id=coalesce(p_provider_refund_id,provider_refund_id),status='failed',failure_code=left(coalesce(p_failure_code,'refund_failed'),120),updated_at=now() where id=v_refund.id;
  end if;
end;$$;
revoke all on function public.finalize_razorpay_refund(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finalize_razorpay_refund(uuid,text,text,text) to service_role;

create or replace function public.transition_order_fulfillment(p_order_id uuid,p_status text,p_carrier text default null,p_tracking_number text default null,p_tracking_url text default null)
returns public.orders language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_row public.orders%rowtype;v_from text;v_carrier text:=nullif(trim(p_carrier),'');v_tracking text:=nullif(trim(p_tracking_number),'');v_url text:=nullif(trim(p_tracking_url),'');
begin
  if not private.is_radvora_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('processing','shipped','delivered') then raise exception 'Invalid fulfillment status'; end if;
  select * into v_row from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_from:=v_row.status;
  if v_from=p_status then return v_row; end if;
  if not ((v_from='paid' and p_status='processing') or (v_from='processing' and p_status='shipped') or (v_from='shipped' and p_status='delivered')) then raise exception 'Invalid order fulfillment transition: % -> %',v_from,p_status; end if;
  if p_status='shipped' and (v_carrier is null or v_tracking is null) then raise exception 'Carrier and tracking number are required before marking an order shipped'; end if;
  if v_url is not null and v_url !~* '^https://[^[:space:]]+$' then raise exception 'Tracking URL must use HTTPS'; end if;
  if p_status='shipped' then
    perform p.id from public.products p join public.order_items oi on oi.product_id=p.id where oi.order_id=p_order_id order by p.id for update;
    if exists(select 1 from public.order_items where order_id=p_order_id and inventory_reserved_quantity<>quantity) then raise exception 'Order inventory reservation is incomplete'; end if;
    update public.products p set stock_on_hand=p.stock_on_hand-r.qty,stock_reserved=p.stock_reserved-r.qty,updated_at=now()
    from (select product_id,sum(inventory_reserved_quantity)::int qty from public.order_items where order_id=p_order_id group by product_id) r where p.id=r.product_id;
    update public.order_items set inventory_reserved_quantity=0 where order_id=p_order_id;
  end if;
  update public.orders set status=p_status,fulfillment_carrier=case when p_status='shipped' then v_carrier else fulfillment_carrier end,tracking_number=case when p_status='shipped' then v_tracking else tracking_number end,tracking_url=case when p_status='shipped' then v_url else tracking_url end,shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,delivered_at=case when p_status='delivered' then coalesce(delivered_at,now()) else delivered_at end,updated_at=now() where id=p_order_id returning * into v_row;
  perform private.write_audit('order_fulfillment_status_change','order',p_order_id::text,'Order fulfillment status changed',jsonb_build_object('from',v_from,'to',p_status,'carrier',v_carrier,'tracking_number',v_tracking,'tracking_url',v_url));
  return v_row;
end;$$;

revoke all on function public.set_product_inventory(uuid,integer) from public,anon;
grant execute on function public.set_product_inventory(uuid,integer) to authenticated;
revoke all on function public.set_product_commerce_enabled(uuid,boolean) from public,anon;
grant execute on function public.set_product_commerce_enabled(uuid,boolean) to authenticated;
revoke all on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.transition_order_fulfillment(uuid,text,text,text,text) from public,anon;
grant execute on function public.transition_order_fulfillment(uuid,text,text,text,text) to authenticated;
