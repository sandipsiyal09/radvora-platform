create or replace function public.server_update_product_catalog(
  p_actor_id uuid,
  p_actor_role text,
  p_product_id uuid,
  p_name text,
  p_short_description text,
  p_description text,
  p_price_inr numeric,
  p_status text
)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_product public.products%rowtype;
  v_name text:=trim(coalesce(p_name,''));
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if char_length(v_name)<1 or char_length(v_name)>200 then raise exception 'Invalid product name'; end if;
  if char_length(coalesce(p_short_description,''))>500 then raise exception 'Short description too long'; end if;
  if char_length(coalesce(p_description,''))>5000 then raise exception 'Description too long'; end if;
  if p_price_inr is not null and p_price_inr<0 then raise exception 'Invalid INR price'; end if;
  if p_status not in ('draft','active','archived') then raise exception 'Invalid product status'; end if;

  update public.products
  set name=v_name,
      short_description=nullif(trim(coalesce(p_short_description,'')),''),
      description=nullif(trim(coalesce(p_description,'')),''),
      price_inr=p_price_inr,
      status=p_status,
      commerce_enabled=case when p_status='active' and p_price_inr is not null and p_price_inr>0 then commerce_enabled else false end,
      updated_at=now()
  where id=p_product_id
  returning * into v_product;
  if not found then raise exception 'Product not found'; end if;

  perform private.write_audit_actor(p_actor_id,'product_catalog_update','product',p_product_id::text,'Updated product catalog record',jsonb_build_object('status',p_status,'price_inr',p_price_inr,'commerce_enabled',v_product.commerce_enabled));
  return v_product;
end;$$;
revoke all on function public.server_update_product_catalog(uuid,text,uuid,text,text,text,numeric,text) from public,anon,authenticated;
grant execute on function public.server_update_product_catalog(uuid,text,uuid,text,text,text,numeric,text) to service_role;

create or replace function public.server_set_product_india_tax_config(
  p_actor_id uuid,
  p_actor_role text,
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
  v_product public.products%rowtype;
  v_hsn text:=nullif(trim(coalesce(p_hsn_code,'')),'');
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if v_hsn is null or v_hsn !~ '^[0-9]{4,8}$' then raise exception 'HSN must contain 4 to 8 digits'; end if;
  if p_gst_rate is null or p_gst_rate<0 or p_gst_rate>100 then raise exception 'GST rate must be between 0 and 100'; end if;
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

  perform private.write_audit_actor(p_actor_id,'product_tax_config','product',p_product_id::text,'Updated India GST/HSN configuration',jsonb_build_object('hsn_code',v_hsn,'gst_rate',p_gst_rate,'price_includes_gst',p_price_includes_gst,'commerce_enabled',false));
  return v_product;
end;$$;
revoke all on function public.server_set_product_india_tax_config(uuid,text,uuid,text,numeric,boolean) from public,anon,authenticated;
grant execute on function public.server_set_product_india_tax_config(uuid,text,uuid,text,numeric,boolean) to service_role;

create or replace function public.server_set_product_commerce_enabled(
  p_actor_id uuid,
  p_actor_role text,
  p_product_id uuid,
  p_enabled boolean
)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_product public.products%rowtype;
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
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
  ) then raise exception 'Product is not ready for India commerce'; end if;

  update public.products set commerce_enabled=p_enabled,updated_at=now() where id=p_product_id returning * into v_product;
  perform private.write_audit_actor(p_actor_id,'product_commerce_toggle','product',p_product_id::text,case when p_enabled then 'Enabled India consumer commerce' else 'Disabled India consumer commerce' end,jsonb_build_object('commerce_enabled',p_enabled,'price_inr',v_product.price_inr,'currency',v_product.currency,'status',v_product.status,'hsn_code',v_product.hsn_code,'gst_rate',v_product.gst_rate,'price_includes_gst',v_product.price_inr_includes_gst));
  return v_product;
end;$$;
revoke all on function public.server_set_product_commerce_enabled(uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.server_set_product_commerce_enabled(uuid,text,uuid,boolean) to service_role;
