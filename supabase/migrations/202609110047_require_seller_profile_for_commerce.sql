create or replace function public.set_product_commerce_enabled(p_product_id uuid,p_enabled boolean)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_role text:=auth.jwt()->'app_metadata'->>'role';
  v_product public.products%rowtype;
  v_seller_ready boolean;
begin
  if v_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  select public.server_india_seller_profile_ready() into v_seller_ready;
  if p_enabled and (
    not coalesce(v_seller_ready,false)
    or v_product.status<>'active'
    or v_product.currency<>'INR'
    or v_product.price_inr is null
    or v_product.price_inr<=0
    or v_product.hsn_code is null
    or v_product.hsn_code !~ '^[0-9]{4,8}$'
    or v_product.gst_rate is null
    or v_product.price_inr_includes_gst is null
    or v_product.stock_on_hand is null
    or (v_product.stock_on_hand-v_product.stock_reserved)<=0
  ) then raise exception 'Product is not ready for India commerce: seller identity, price, GST/HSN and available inventory are required'; end if;
  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit('product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'seller_profile_ready',v_seller_ready,'stock_on_hand',v_product.stock_on_hand,'stock_reserved',v_product.stock_reserved));
  return v_product;
end;$$;

create or replace function public.server_set_product_commerce_enabled(
  p_actor_id uuid,p_actor_role text,p_product_id uuid,p_enabled boolean
)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_product public.products%rowtype;
  v_seller_ready boolean;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  select public.server_india_seller_profile_ready() into v_seller_ready;
  if p_enabled and (
    not coalesce(v_seller_ready,false)
    or v_product.status<>'active'
    or v_product.currency<>'INR'
    or v_product.price_inr is null
    or v_product.price_inr<=0
    or v_product.hsn_code is null
    or v_product.hsn_code !~ '^[0-9]{4,8}$'
    or v_product.gst_rate is null
    or v_product.price_inr_includes_gst is null
    or v_product.stock_on_hand is null
    or (v_product.stock_on_hand-v_product.stock_reserved)<=0
  ) then raise exception 'Product is not ready for India commerce'; end if;
  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit_actor(p_actor_id,'product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'seller_profile_ready',v_seller_ready,'price_inr',v_product.price_inr,'hsn_code',v_product.hsn_code,'gst_rate',v_product.gst_rate,'stock_on_hand',v_product.stock_on_hand,'stock_reserved',v_product.stock_reserved));
  return v_product;
end;$$;
revoke all on function public.server_set_product_commerce_enabled(uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.server_set_product_commerce_enabled(uuid,text,uuid,boolean) to service_role;

create or replace function public.server_runtime_schema_version()
returns text
language sql
stable
security invoker
set search_path=public,pg_temp
as $$ select '202609110047'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;
