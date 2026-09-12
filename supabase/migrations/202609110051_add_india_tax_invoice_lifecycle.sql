-- India B2C tax-invoice infrastructure. All statutory/business values remain
-- fail-closed inputs: no GSTIN, HSN, GST rate, UQC, signatory, seller identity,
-- invoice series, price, or stock value is invented by this migration.

alter table public.products add column if not exists gst_unit_code text;
alter table public.products drop constraint if exists products_gst_unit_code_format;
alter table public.products add constraint products_gst_unit_code_format
  check (gst_unit_code is null or gst_unit_code ~ '^[A-Z0-9]{1,10}$');

alter table public.order_items add column if not exists gst_unit_code text;
alter table public.order_items drop constraint if exists order_items_gst_unit_code_format;
alter table public.order_items add constraint order_items_gst_unit_code_format
  check (gst_unit_code is null or gst_unit_code ~ '^[A-Z0-9]{1,10}$');

alter table public.orders add column if not exists shipping_state_code text;
alter table public.orders drop constraint if exists orders_shipping_state_code_format;
alter table public.orders add constraint orders_shipping_state_code_format
  check (shipping_state_code is null or shipping_state_code ~ '^[0-9]{2}$');

alter table public.india_seller_profile
  add column if not exists invoice_series_prefix text,
  add column if not exists invoice_authorized_signatory text;
alter table public.india_seller_profile drop constraint if exists india_seller_profile_invoice_series_format;
alter table public.india_seller_profile add constraint india_seller_profile_invoice_series_format
  check (invoice_series_prefix is null or invoice_series_prefix ~ '^[A-Z0-9]{1,3}$');
alter table public.india_seller_profile drop constraint if exists india_seller_profile_signatory_length;
alter table public.india_seller_profile add constraint india_seller_profile_signatory_length
  check (invoice_authorized_signatory is null or char_length(invoice_authorized_signatory) between 2 and 160);

create table if not exists public.invoice_sequences (
  financial_year text not null check (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  series_prefix text not null check (series_prefix ~ '^[A-Z0-9]{1,3}$'),
  last_number integer not null check (last_number > 0),
  updated_at timestamptz not null default now(),
  primary key(financial_year,series_prefix)
);
alter table public.invoice_sequences enable row level security;
revoke all on table public.invoice_sequences from public,anon,authenticated;
grant all on table public.invoice_sequences to service_role;

create table if not exists public.order_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  invoice_number text not null unique check (char_length(invoice_number) between 1 and 16),
  financial_year text not null,
  issued_at timestamptz not null default now(),
  status text not null default 'issued' check (status in ('issued','void')),
  seller_legal_name text not null,
  seller_gstin text not null check (seller_gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  seller_registered_state text not null,
  seller_state_code text not null check (seller_state_code ~ '^[0-9]{2}$'),
  seller_address_line1 text not null,
  seller_address_line2 text,
  seller_city text not null,
  seller_postal_code text not null check (seller_postal_code ~ '^[1-9][0-9]{5}$'),
  seller_support_email text not null,
  authorized_signatory text not null,
  recipient_name text not null,
  recipient_address_line1 text not null,
  recipient_address_line2 text,
  recipient_city text not null,
  recipient_state text not null,
  recipient_state_code text not null check (recipient_state_code ~ '^[0-9]{2}$'),
  recipient_postal_code text not null check (recipient_postal_code ~ '^[1-9][0-9]{5}$'),
  place_of_supply_state text not null,
  place_of_supply_state_code text not null check (place_of_supply_state_code ~ '^[0-9]{2}$'),
  supply_type text not null check (supply_type in ('intra_state','inter_state')),
  currency text not null default 'INR' check (currency='INR'),
  taxable_value numeric(14,2) not null check (taxable_value >= 0),
  cgst_amount numeric(14,2) not null default 0 check (cgst_amount >= 0),
  sgst_amount numeric(14,2) not null default 0 check (sgst_amount >= 0),
  igst_amount numeric(14,2) not null default 0 check (igst_amount >= 0),
  shipping_amount numeric(14,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(14,2) not null check (total_amount > 0),
  reverse_charge boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.order_invoices enable row level security;
revoke all on table public.order_invoices from public,anon,authenticated;
grant select on table public.order_invoices to authenticated;
grant all on table public.order_invoices to service_role;
drop policy if exists order_invoices_read_owner_or_admin on public.order_invoices;
create policy order_invoices_read_owner_or_admin on public.order_invoices
for select to authenticated
using (
  exists(
    select 1 from public.orders o where o.id=order_invoices.order_id
      and (
        o.user_id=(select auth.uid())
        or (
          ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
          and ((select auth.jwt())->>'aal')='aal2'
        )
      )
  )
);

create table if not exists public.order_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.order_invoices(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  hsn_code text not null check (hsn_code ~ '^[0-9]{4,8}$'),
  gst_unit_code text not null check (gst_unit_code ~ '^[A-Z0-9]{1,10}$'),
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  taxable_value numeric(14,2) not null check (taxable_value >= 0),
  gst_rate numeric(7,3) not null check (gst_rate >= 0 and gst_rate <= 100),
  cgst_amount numeric(14,2) not null default 0 check (cgst_amount >= 0),
  sgst_amount numeric(14,2) not null default 0 check (sgst_amount >= 0),
  igst_amount numeric(14,2) not null default 0 check (igst_amount >= 0),
  gross_total numeric(14,2) not null check (gross_total >= 0),
  created_at timestamptz not null default now()
);
alter table public.order_invoice_items enable row level security;
revoke all on table public.order_invoice_items from public,anon,authenticated;
grant select on table public.order_invoice_items to authenticated;
grant all on table public.order_invoice_items to service_role;
drop policy if exists order_invoice_items_read_owner_or_admin on public.order_invoice_items;
create policy order_invoice_items_read_owner_or_admin on public.order_invoice_items
for select to authenticated
using (
  exists(
    select 1 from public.order_invoices i
    join public.orders o on o.id=i.order_id
    where i.id=order_invoice_items.invoice_id
      and (
        o.user_id=(select auth.uid())
        or (
          ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
          and ((select auth.jwt())->>'aal')='aal2'
        )
      )
  )
);

create or replace function public.server_india_seller_profile_ready()
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select exists(
    select 1 from public.india_seller_profile
    where profile_key='primary'
      and legal_name is not null
      and gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'
      and registered_state is not null
      and registered_state_code ~ '^[0-9]{2}$'
      and left(gstin,2)=registered_state_code
      and address_line1 is not null
      and city is not null
      and postal_code ~ '^[1-9][0-9]{5}$'
      and support_email is not null
      and invoice_series_prefix ~ '^[A-Z0-9]{1,3}$'
      and char_length(invoice_authorized_signatory) between 2 and 160
  );
$$;
revoke all on function public.server_india_seller_profile_ready() from public,anon,authenticated;
grant execute on function public.server_india_seller_profile_ready() to service_role;

create or replace function public.server_set_india_seller_profile(
  p_actor_id uuid,p_actor_role text,p_legal_name text,p_gstin text,
  p_registered_state text,p_registered_state_code text,p_address_line1 text,
  p_address_line2 text,p_city text,p_postal_code text,p_support_email text,
  p_invoice_series_prefix text,p_invoice_authorized_signatory text
)
returns public.india_seller_profile
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_row public.india_seller_profile%rowtype;
  v_legal_name text:=trim(coalesce(p_legal_name,''));
  v_gstin text:=upper(trim(coalesce(p_gstin,'')));
  v_state text:=trim(coalesce(p_registered_state,''));
  v_state_code text:=trim(coalesce(p_registered_state_code,''));
  v_line1 text:=trim(coalesce(p_address_line1,''));
  v_line2 text:=nullif(trim(coalesce(p_address_line2,'')),'');
  v_city text:=trim(coalesce(p_city,''));
  v_postal text:=trim(coalesce(p_postal_code,''));
  v_email text:=lower(trim(coalesce(p_support_email,'')));
  v_series text:=upper(trim(coalesce(p_invoice_series_prefix,'')));
  v_signatory text:=trim(coalesce(p_invoice_authorized_signatory,''));
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if char_length(v_legal_name)<2 or char_length(v_legal_name)>200 then raise exception 'Invalid seller legal name'; end if;
  if v_gstin !~ '^[0-9]{2}[A-Z0-9]{13}$' then raise exception 'Invalid GSTIN'; end if;
  if v_state_code !~ '^[0-9]{2}$' or left(v_gstin,2)<>v_state_code then raise exception 'Registered state code must match GSTIN'; end if;
  if char_length(v_state)<2 or char_length(v_state)>100 then raise exception 'Invalid registered state'; end if;
  if char_length(v_line1)<5 or char_length(v_line1)>180 then raise exception 'Invalid registered address'; end if;
  if v_line2 is not null and char_length(v_line2)>180 then raise exception 'Address line 2 is too long'; end if;
  if char_length(v_city)<2 or char_length(v_city)>100 then raise exception 'Invalid city'; end if;
  if v_postal !~ '^[1-9][0-9]{5}$' then raise exception 'Invalid postal code'; end if;
  if char_length(v_email)<3 or char_length(v_email)>320 or position('@' in v_email)<2 then raise exception 'Invalid support email'; end if;
  if v_series !~ '^[A-Z0-9]{1,3}$' then raise exception 'Invoice series prefix must be 1-3 uppercase letters/numbers'; end if;
  if char_length(v_signatory)<2 or char_length(v_signatory)>160 then raise exception 'Invalid invoice authorized signatory'; end if;

  insert into public.india_seller_profile(profile_key,legal_name,gstin,registered_state,registered_state_code,address_line1,address_line2,city,postal_code,support_email,invoice_series_prefix,invoice_authorized_signatory,updated_by,updated_at)
  values('primary',v_legal_name,v_gstin,v_state,v_state_code,v_line1,v_line2,v_city,v_postal,v_email,v_series,v_signatory,p_actor_id,now())
  on conflict(profile_key) do update set
    legal_name=excluded.legal_name,gstin=excluded.gstin,registered_state=excluded.registered_state,
    registered_state_code=excluded.registered_state_code,address_line1=excluded.address_line1,
    address_line2=excluded.address_line2,city=excluded.city,postal_code=excluded.postal_code,
    support_email=excluded.support_email,invoice_series_prefix=excluded.invoice_series_prefix,
    invoice_authorized_signatory=excluded.invoice_authorized_signatory,updated_by=excluded.updated_by,updated_at=now()
  returning * into v_row;
  update public.products set commerce_enabled=false,updated_at=now() where commerce_enabled=true;
  perform private.write_audit_actor(p_actor_id,'india_seller_profile_update','commerce','india-primary','Updated India seller/invoice identity; commerce disabled pending review',jsonb_build_object('gstin',v_gstin,'registered_state_code',v_state_code,'invoice_series_prefix',v_series));
  return v_row;
end;$$;
revoke all on function public.server_set_india_seller_profile(uuid,text,text,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.server_set_india_seller_profile(uuid,text,text,text,text,text,text,text,text,text,text,text,text) to service_role;

create or replace function public.server_set_product_commerce_enabled(p_actor_id uuid,p_actor_role text,p_product_id uuid,p_enabled boolean)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare v_product public.products%rowtype;v_seller_ready boolean;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  select public.server_india_seller_profile_ready() into v_seller_ready;
  if p_enabled and (
    not coalesce(v_seller_ready,false) or v_product.status<>'active' or v_product.currency<>'INR'
    or v_product.price_inr is null or v_product.price_inr<=0
    or v_product.hsn_code is null or v_product.hsn_code !~ '^[0-9]{4,8}$'
    or v_product.gst_unit_code is null or v_product.gst_unit_code !~ '^[A-Z0-9]{1,10}$'
    or v_product.gst_rate is null or v_product.price_inr_includes_gst is null
    or v_product.stock_on_hand is null or (v_product.stock_on_hand-v_product.stock_reserved)<=0
  ) then raise exception 'Product is not ready for India commerce/invoicing'; end if;
  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit_actor(p_actor_id,'product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'seller_profile_ready',v_seller_ready,'price_inr',v_product.price_inr,'hsn_code',v_product.hsn_code,'gst_unit_code',v_product.gst_unit_code,'gst_rate',v_product.gst_rate,'stock_on_hand',v_product.stock_on_hand,'stock_reserved',v_product.stock_reserved));
  return v_product;
end;$$;
revoke all on function public.server_set_product_commerce_enabled(uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.server_set_product_commerce_enabled(uuid,text,uuid,boolean) to service_role;

-- New checkout signature includes the recipient State/UT code used for place of supply.
create or replace function public.checkout_active_cart_india(
  p_name text,p_phone text,p_line1 text,p_line2 text,p_city text,p_state text,p_state_code text,p_postal_code text,p_terms_version text
)
returns table(order_id uuid,order_number text,subtotal numeric,total numeric,currency text,checkout_terms_accepted_at timestamptz)
language plpgsql security definer set search_path=public,private,pg_temp as $$
declare
  v_user uuid:=auth.uid();v_cart uuid;v_order uuid;v_order_number text;v_subtotal numeric:=0;v_tax numeric:=0;v_total numeric:=0;
  v_email text:=auth.jwt()->>'email';v_accepted_at timestamptz:=now();v_name text:=trim(coalesce(p_name,''));v_phone text:=trim(coalesce(p_phone,''));
  v_line1 text:=trim(coalesce(p_line1,''));v_line2 text:=nullif(trim(coalesce(p_line2,'')),'');v_city text:=trim(coalesce(p_city,''));v_state text:=trim(coalesce(p_state,''));v_state_code text:=trim(coalesce(p_state_code,''));v_postal text:=trim(coalesce(p_postal_code,''));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_terms_version<>'2026-09-11-india-v1' then raise exception 'Invalid checkout policy version'; end if;
  if char_length(v_name)<2 or char_length(v_name)>120 then raise exception 'Invalid delivery name'; end if;
  if v_phone !~ '^\+91[6-9][0-9]{9}$' then raise exception 'Invalid Indian mobile number'; end if;
  if char_length(v_line1)<5 or char_length(v_line1)>180 then raise exception 'Invalid address line 1'; end if;
  if v_line2 is not null and char_length(v_line2)>180 then raise exception 'Invalid address line 2'; end if;
  if char_length(v_city)<2 or char_length(v_city)>100 then raise exception 'Invalid city'; end if;
  if char_length(v_state)<2 or char_length(v_state)>100 or v_state_code !~ '^[0-9]{2}$' then raise exception 'Invalid state/state code'; end if;
  if v_postal !~ '^[1-9][0-9]{5}$' then raise exception 'Invalid PIN code'; end if;
  select c.id into v_cart from public.carts c where c.user_id=v_user and c.status='active' order by c.created_at desc limit 1 for update;
  if v_cart is null then raise exception 'No active cart'; end if;
  if not exists(select 1 from public.cart_items ci where ci.cart_id=v_cart) then raise exception 'Cart is empty'; end if;
  perform p.id from public.products p join public.cart_items ci on ci.product_id=p.id where ci.cart_id=v_cart order by p.id for update;
  if exists(select 1 from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart and (
      p.status<>'active' or p.commerce_enabled<>true or p.currency<>'INR' or p.price_inr is null or p.price_inr<=0
      or p.hsn_code is null or p.hsn_code !~ '^[0-9]{4,8}$' or p.gst_unit_code is null or p.gst_unit_code !~ '^[A-Z0-9]{1,10}$'
      or p.gst_rate is null or p.price_inr_includes_gst is null or p.stock_on_hand is null or ci.quantity>(p.stock_on_hand-p.stock_reserved)
    )) then raise exception 'One or more cart products are unavailable, invoice-unconfigured or out of stock'; end if;
  select coalesce(sum(x.line_subtotal),0),coalesce(sum(x.tax_amount),0) into v_subtotal,v_tax from (
    select round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)/(1+(p.gst_rate/100)) else ci.quantity*p.price_inr end,2) line_subtotal,
      round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)-((ci.quantity*p.price_inr)/(1+(p.gst_rate/100))) else (ci.quantity*p.price_inr)*(p.gst_rate/100) end,2) tax_amount
    from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart) x;
  v_subtotal:=round(v_subtotal,2);v_tax:=round(v_tax,2);v_total:=round(v_subtotal+v_tax,2);
  if v_total<=0 then raise exception 'Invalid cart total'; end if;
  v_order_number:='RV-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.orders(user_id,order_number,email,status,currency,subtotal,tax,shipping,total,shipping_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_state,shipping_state_code,shipping_postal_code,shipping_country,checkout_terms_accepted_at,checkout_terms_version)
  values(v_user,v_order_number,v_email,'pending','INR',v_subtotal,v_tax,0,v_total,v_name,v_phone,v_line1,v_line2,v_city,v_state,v_state_code,v_postal,'IN',v_accepted_at,p_terms_version) returning id into v_order;
  insert into public.order_items(order_id,product_id,quantity,unit_price,line_subtotal,tax_amount,line_total,hsn_code,gst_unit_code,gst_rate,price_includes_gst,inventory_reserved_quantity)
  select v_order,ci.product_id,ci.quantity,p.price_inr,
    round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)/(1+(p.gst_rate/100)) else ci.quantity*p.price_inr end,2),
    round(case when p.price_inr_includes_gst then (ci.quantity*p.price_inr)-((ci.quantity*p.price_inr)/(1+(p.gst_rate/100))) else (ci.quantity*p.price_inr)*(p.gst_rate/100) end,2),
    round(case when p.price_inr_includes_gst then ci.quantity*p.price_inr else (ci.quantity*p.price_inr)*(1+(p.gst_rate/100)) end,2),
    p.hsn_code,p.gst_unit_code,p.gst_rate,p.price_inr_includes_gst,ci.quantity
  from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;
  update public.products p set stock_reserved=p.stock_reserved+r.qty,updated_at=now() from (select ci.product_id,sum(ci.quantity)::int qty from public.cart_items ci where ci.cart_id=v_cart group by ci.product_id) r where p.id=r.product_id;
  update public.carts set status='converted',updated_at=now() where id=v_cart;
  perform private.write_audit('checkout_order_create','order',v_order::text,'Customer created India checkout order with inventory reservation and State code',jsonb_build_object('cart_id',v_cart,'subtotal',v_subtotal,'tax',v_tax,'total',v_total,'currency','INR','shipping_state_code',v_state_code));
  return query select o.id,o.order_number,o.subtotal,o.total,o.currency,o.checkout_terms_accepted_at from public.orders o where o.id=v_order;
end;$$;
revoke all on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text) from authenticated;
revoke all on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.checkout_active_cart_india(text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.server_issue_order_invoice(p_actor_id uuid,p_actor_role text,p_order_id uuid)
returns public.order_invoices
language plpgsql security definer set search_path=public,private,pg_temp as $$
declare
  v_existing public.order_invoices%rowtype;v_order public.orders%rowtype;v_seller public.india_seller_profile%rowtype;
  v_invoice public.order_invoices%rowtype;v_local_date date;v_start_year integer;v_end_year integer;v_fy text;v_seq integer;v_number text;v_intra boolean;
  v_cgst numeric:=0;v_sgst numeric:=0;v_igst numeric:=0;v_calc_tax numeric:=0;v_calc_total numeric:=0;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_existing from public.order_invoices where order_id=p_order_id;
  if found then return v_existing; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status not in ('paid','processing') then raise exception 'Invoice can only be issued before shipment for a paid/processing order'; end if;
  if v_order.currency<>'INR' or v_order.shipping<>0 then raise exception 'Invoice supports the current INR/no-shipping-charge launch model only'; end if;
  if v_order.shipping_country<>'IN' or v_order.shipping_state_code !~ '^[0-9]{2}$' then raise exception 'Order is missing India State code'; end if;
  select * into v_seller from public.india_seller_profile where profile_key='primary' for share;
  if not found or not public.server_india_seller_profile_ready() then raise exception 'Seller invoice profile is incomplete'; end if;
  if exists(select 1 from public.order_items oi where oi.order_id=p_order_id and (oi.hsn_code is null or oi.gst_unit_code is null or oi.gst_rate is null or oi.line_subtotal is null or oi.tax_amount is null)) then raise exception 'Order line invoice snapshot is incomplete'; end if;
  v_intra:=v_seller.registered_state_code=v_order.shipping_state_code;
  select coalesce(sum(case when v_intra then round(oi.tax_amount/2,2) else 0 end),0),
         coalesce(sum(case when v_intra then oi.tax_amount-round(oi.tax_amount/2,2) else 0 end),0),
         coalesce(sum(case when not v_intra then oi.tax_amount else 0 end),0),
         coalesce(sum(oi.tax_amount),0),coalesce(sum(oi.line_total),0)
  into v_cgst,v_sgst,v_igst,v_calc_tax,v_calc_total from public.order_items oi where oi.order_id=p_order_id;
  if abs(v_calc_tax-v_order.tax)>=0.011 or abs(v_calc_total-v_order.total)>=0.011 then raise exception 'Order tax totals do not reconcile for invoicing'; end if;
  v_local_date:=timezone('Asia/Kolkata',now())::date;
  v_start_year:=extract(year from v_local_date)::int-case when extract(month from v_local_date)::int<4 then 1 else 0 end;
  v_end_year:=v_start_year+1;v_fy:=v_start_year::text||'-'||right(v_end_year::text,2);
  insert into public.invoice_sequences(financial_year,series_prefix,last_number) values(v_fy,v_seller.invoice_series_prefix,1)
  on conflict(financial_year,series_prefix) do update set last_number=public.invoice_sequences.last_number+1,updated_at=now()
  returning last_number into v_seq;
  v_number:=v_seller.invoice_series_prefix||'/'||right(v_start_year::text,2)||'-'||right(v_end_year::text,2)||'/'||lpad(v_seq::text,6,'0');
  if char_length(v_number)>16 then raise exception 'Invoice number exceeds supported statutory length'; end if;
  insert into public.order_invoices(order_id,invoice_number,financial_year,seller_legal_name,seller_gstin,seller_registered_state,seller_state_code,seller_address_line1,seller_address_line2,seller_city,seller_postal_code,seller_support_email,authorized_signatory,recipient_name,recipient_address_line1,recipient_address_line2,recipient_city,recipient_state,recipient_state_code,recipient_postal_code,place_of_supply_state,place_of_supply_state_code,supply_type,currency,taxable_value,cgst_amount,sgst_amount,igst_amount,shipping_amount,total_amount,reverse_charge)
  values(v_order.id,v_number,v_fy,v_seller.legal_name,v_seller.gstin,v_seller.registered_state,v_seller.registered_state_code,v_seller.address_line1,v_seller.address_line2,v_seller.city,v_seller.postal_code,v_seller.support_email,v_seller.invoice_authorized_signatory,v_order.shipping_name,v_order.shipping_line1,v_order.shipping_line2,v_order.shipping_city,v_order.shipping_state,v_order.shipping_state_code,v_order.shipping_postal_code,v_order.shipping_state,v_order.shipping_state_code,case when v_intra then 'intra_state' else 'inter_state' end,'INR',v_order.subtotal,v_cgst,v_sgst,v_igst,v_order.shipping,v_order.total,false)
  returning * into v_invoice;
  insert into public.order_invoice_items(invoice_id,product_id,description,hsn_code,gst_unit_code,quantity,unit_price,taxable_value,gst_rate,cgst_amount,sgst_amount,igst_amount,gross_total)
  select v_invoice.id,oi.product_id,p.name,oi.hsn_code,oi.gst_unit_code,oi.quantity,oi.unit_price,oi.line_subtotal,oi.gst_rate,
    case when v_intra then round(oi.tax_amount/2,2) else 0 end,
    case when v_intra then oi.tax_amount-round(oi.tax_amount/2,2) else 0 end,
    case when not v_intra then oi.tax_amount else 0 end,oi.line_total
  from public.order_items oi join public.products p on p.id=oi.product_id where oi.order_id=p_order_id;
  perform private.write_audit_actor(p_actor_id,'india_tax_invoice_issued','order',p_order_id::text,'Issued sequential India tax invoice before shipment',jsonb_build_object('invoice_number',v_number,'financial_year',v_fy,'supply_type',v_invoice.supply_type,'total',v_invoice.total_amount));
  return v_invoice;
end;$$;
revoke all on function public.server_issue_order_invoice(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.server_issue_order_invoice(uuid,text,uuid) to service_role;

create or replace function public.server_transition_order_fulfillment(p_actor_id uuid,p_actor_role text,p_order_id uuid,p_status text,p_carrier text default null,p_tracking_number text default null,p_tracking_url text default null)
returns public.orders language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_row public.orders%rowtype;v_from text;v_carrier text:=nullif(trim(coalesce(p_carrier,'')),'');v_tracking text:=nullif(trim(coalesce(p_tracking_number,'')),'');v_url text:=nullif(trim(coalesce(p_tracking_url,'')),'');
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_status not in ('processing','shipped','delivered') then raise exception 'Invalid fulfillment status'; end if;
  if v_carrier is not null and char_length(v_carrier)>120 then raise exception 'Carrier is too long'; end if;
  if v_tracking is not null and char_length(v_tracking)>160 then raise exception 'Tracking number is too long'; end if;
  if v_url is not null and (char_length(v_url)>500 or v_url !~* '^https://[^[:space:]]+$') then raise exception 'Tracking URL must be a bounded HTTPS URL'; end if;
  select * into v_row from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_from:=v_row.status;if v_from=p_status then return v_row; end if;
  if not ((v_from='paid' and p_status='processing') or (v_from='processing' and p_status='shipped') or (v_from='shipped' and p_status='delivered')) then raise exception 'Invalid order fulfillment transition: % -> %',v_from,p_status; end if;
  if p_status='shipped' and (v_carrier is null or v_tracking is null) then raise exception 'Carrier and tracking number are required before marking an order shipped'; end if;
  if p_status='shipped' then
    perform public.server_issue_order_invoice(p_actor_id,p_actor_role,p_order_id);
    perform p.id from public.products p join public.order_items oi on oi.product_id=p.id where oi.order_id=p_order_id order by p.id for update;
    if exists(select 1 from public.order_items where order_id=p_order_id and inventory_reserved_quantity<>quantity) then raise exception 'Order inventory reservation is incomplete'; end if;
    update public.products p set stock_on_hand=p.stock_on_hand-r.qty,stock_reserved=p.stock_reserved-r.qty,updated_at=now() from (select product_id,sum(inventory_reserved_quantity)::int qty from public.order_items where order_id=p_order_id group by product_id) r where p.id=r.product_id;
    update public.order_items set inventory_reserved_quantity=0 where order_id=p_order_id;
  end if;
  update public.orders set status=p_status,fulfillment_carrier=case when p_status='shipped' then v_carrier else fulfillment_carrier end,tracking_number=case when p_status='shipped' then v_tracking else tracking_number end,tracking_url=case when p_status='shipped' then v_url else tracking_url end,shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,delivered_at=case when p_status='delivered' then coalesce(delivered_at,now()) else delivered_at end,updated_at=now() where id=p_order_id returning * into v_row;
  perform private.write_audit_actor(p_actor_id,'order_fulfillment_status_change','order',p_order_id::text,'Order fulfillment status changed',jsonb_build_object('from',v_from,'to',p_status,'carrier',v_carrier,'tracking_number',v_tracking,'tracking_url',v_url));return v_row;
end;$$;
revoke all on function public.server_transition_order_fulfillment(uuid,text,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.server_transition_order_fulfillment(uuid,text,uuid,text,text,text,text) to service_role;

create or replace function public.server_runtime_schema_version()
returns text language sql stable security invoker set search_path=public,pg_temp
as $$ select '202609110051'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;
