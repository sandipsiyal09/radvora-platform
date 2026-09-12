create or replace function public.server_set_product_india_tax_config(
  p_actor_id uuid,p_actor_role text,p_product_id uuid,p_hsn_code text,p_gst_unit_code text,p_gst_rate numeric,p_price_includes_gst boolean
)
returns public.products
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_product public.products%rowtype;
  v_hsn text:=nullif(trim(coalesce(p_hsn_code,'')),'');
  v_unit text:=upper(nullif(trim(coalesce(p_gst_unit_code,'')),''));
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if v_hsn is null or v_hsn !~ '^[0-9]{4,8}$' then raise exception 'HSN must contain 4 to 8 digits'; end if;
  if v_unit is null or v_unit !~ '^[A-Z0-9]{1,10}$' then raise exception 'GST unit/UQC is required'; end if;
  if p_gst_rate is null or p_gst_rate<0 or p_gst_rate>100 then raise exception 'GST rate must be between 0 and 100'; end if;
  if p_price_includes_gst is null then raise exception 'Price GST treatment must be explicit'; end if;
  update public.products set hsn_code=v_hsn,gst_unit_code=v_unit,gst_rate=p_gst_rate,price_inr_includes_gst=p_price_includes_gst,commerce_enabled=false,updated_at=now() where id=p_product_id returning * into v_product;
  if not found then raise exception 'Product not found'; end if;
  perform private.write_audit_actor(p_actor_id,'product_tax_config','product',p_product_id::text,'Updated India GST/HSN/UQC configuration; commerce disabled pending review',jsonb_build_object('hsn_code',v_hsn,'gst_unit_code',v_unit,'gst_rate',p_gst_rate,'price_includes_gst',p_price_includes_gst));
  return v_product;
end;$$;
revoke all on function public.server_set_product_india_tax_config(uuid,text,uuid,text,text,numeric,boolean) from public,anon,authenticated;
grant execute on function public.server_set_product_india_tax_config(uuid,text,uuid,text,text,numeric,boolean) to service_role;

-- The prior 6-argument server tax setter must not remain a weaker path after release.
revoke all on function public.server_set_product_india_tax_config(uuid,text,uuid,text,numeric,boolean) from public,anon,authenticated,service_role;

create or replace function public.server_runtime_schema_version()
returns text language sql stable security invoker set search_path=public,pg_temp
as $$ select '202609110052'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;
