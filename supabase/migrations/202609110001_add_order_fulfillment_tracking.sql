alter table public.orders
  add column if not exists shipping_name text,
  add column if not exists shipping_phone text,
  add column if not exists shipping_line1 text,
  add column if not exists shipping_line2 text,
  add column if not exists shipping_city text,
  add column if not exists shipping_state text,
  add column if not exists shipping_postal_code text,
  add column if not exists shipping_country text,
  add column if not exists fulfillment_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create or replace function public.transition_order_fulfillment(
  p_order_id uuid,
  p_status text,
  p_carrier text default null,
  p_tracking_number text default null,
  p_tracking_url text default null
)
returns public.orders
language plpgsql
security definer
set search_path to 'public','private','pg_temp'
as $$
declare
  v_row public.orders%rowtype;
  v_from text;
  v_carrier text := nullif(trim(p_carrier),'');
  v_tracking text := nullif(trim(p_tracking_number),'');
  v_url text := nullif(trim(p_tracking_url),'');
begin
  if not private.is_radvora_admin() then
    raise exception 'Admin access required';
  end if;

  if p_status not in ('processing','shipped','delivered') then
    raise exception 'Invalid fulfillment status';
  end if;

  select * into v_row from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_from := v_row.status;

  if v_from = p_status then return v_row; end if;
  if not (
    (v_from='paid' and p_status='processing') or
    (v_from='processing' and p_status='shipped') or
    (v_from='shipped' and p_status='delivered')
  ) then
    raise exception 'Invalid order fulfillment transition: % -> %', v_from, p_status;
  end if;

  if p_status='shipped' and (v_carrier is null or v_tracking is null) then
    raise exception 'Carrier and tracking number are required before marking an order shipped';
  end if;

  if v_url is not null and v_url !~* '^https://[^[:space:]]+$' then
    raise exception 'Tracking URL must use HTTPS';
  end if;

  update public.orders
  set status = p_status,
      fulfillment_carrier = case when p_status='shipped' then v_carrier else fulfillment_carrier end,
      tracking_number = case when p_status='shipped' then v_tracking else tracking_number end,
      tracking_url = case when p_status='shipped' then v_url else tracking_url end,
      shipped_at = case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,
      delivered_at = case when p_status='delivered' then coalesce(delivered_at,now()) else delivered_at end,
      updated_at = now()
  where id = p_order_id
  returning * into v_row;

  perform private.write_audit(
    'order_fulfillment_status_change','order',p_order_id::text,
    'Order fulfillment status changed',
    jsonb_build_object('from',v_from,'to',p_status,'carrier',v_carrier,'tracking_number',v_tracking,'tracking_url',v_url)
  );
  return v_row;
end;
$$;

revoke all on function public.transition_order_fulfillment(uuid,text,text,text,text) from public;
grant execute on function public.transition_order_fulfillment(uuid,text,text,text,text) to authenticated;
