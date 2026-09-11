create or replace function public.server_transition_order_fulfillment(
  p_actor_id uuid,
  p_actor_role text,
  p_order_id uuid,
  p_status text,
  p_carrier text default null,
  p_tracking_number text default null,
  p_tracking_url text default null
)
returns public.orders
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_row public.orders%rowtype;
  v_from text;
  v_carrier text:=nullif(trim(coalesce(p_carrier,'')),'');
  v_tracking text:=nullif(trim(coalesce(p_tracking_number,'')),'');
  v_url text:=nullif(trim(coalesce(p_tracking_url,'')),'');
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_status not in ('processing','shipped','delivered') then raise exception 'Invalid fulfillment status'; end if;
  if v_carrier is not null and char_length(v_carrier)>120 then raise exception 'Carrier is too long'; end if;
  if v_tracking is not null and char_length(v_tracking)>160 then raise exception 'Tracking number is too long'; end if;
  if v_url is not null and (char_length(v_url)>500 or v_url !~* '^https://[^[:space:]]+$') then raise exception 'Tracking URL must be a bounded HTTPS URL'; end if;

  select * into v_row from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_from:=v_row.status;
  if v_from=p_status then return v_row; end if;
  if not ((v_from='paid' and p_status='processing') or (v_from='processing' and p_status='shipped') or (v_from='shipped' and p_status='delivered')) then raise exception 'Invalid order fulfillment transition: % -> %',v_from,p_status; end if;
  if p_status='shipped' and (v_carrier is null or v_tracking is null) then raise exception 'Carrier and tracking number are required before marking an order shipped'; end if;

  if p_status='shipped' then
    perform p.id from public.products p join public.order_items oi on oi.product_id=p.id where oi.order_id=p_order_id order by p.id for update;
    if exists(select 1 from public.order_items where order_id=p_order_id and inventory_reserved_quantity<>quantity) then raise exception 'Order inventory reservation is incomplete'; end if;
    update public.products p set stock_on_hand=p.stock_on_hand-r.qty,stock_reserved=p.stock_reserved-r.qty,updated_at=now()
    from (select product_id,sum(inventory_reserved_quantity)::int qty from public.order_items where order_id=p_order_id group by product_id) r
    where p.id=r.product_id;
    update public.order_items set inventory_reserved_quantity=0 where order_id=p_order_id;
  end if;

  update public.orders set
    status=p_status,
    fulfillment_carrier=case when p_status='shipped' then v_carrier else fulfillment_carrier end,
    tracking_number=case when p_status='shipped' then v_tracking else tracking_number end,
    tracking_url=case when p_status='shipped' then v_url else tracking_url end,
    shipped_at=case when p_status='shipped' then coalesce(shipped_at,now()) else shipped_at end,
    delivered_at=case when p_status='delivered' then coalesce(delivered_at,now()) else delivered_at end,
    updated_at=now()
  where id=p_order_id returning * into v_row;

  perform private.write_audit_actor(p_actor_id,'order_fulfillment_status_change','order',p_order_id::text,'Order fulfillment status changed',jsonb_build_object('from',v_from,'to',p_status,'carrier',v_carrier,'tracking_number',v_tracking,'tracking_url',v_url));
  return v_row;
end;$$;
revoke all on function public.server_transition_order_fulfillment(uuid,text,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.server_transition_order_fulfillment(uuid,text,uuid,text,text,text,text) to service_role;

create or replace function public.server_transition_support_ticket(
  p_actor_id uuid,
  p_actor_role text,
  p_ticket_id uuid,
  p_status text,
  p_comment text default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_row public.support_tickets%rowtype;
  v_from text;
  v_comment text:=nullif(trim(coalesce(p_comment,'')),'');
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_status not in ('open','in_progress','waiting_customer','resolved','closed') then raise exception 'Invalid support status'; end if;
  if v_comment is not null and char_length(v_comment)>2000 then raise exception 'Support audit note is too long'; end if;
  select * into v_row from public.support_tickets where id=p_ticket_id for update;
  if not found then raise exception 'Support ticket not found'; end if;
  v_from:=v_row.status;
  if v_from=p_status then return v_row; end if;
  if not (
    (v_from='open' and p_status in ('in_progress','resolved','closed')) or
    (v_from='in_progress' and p_status in ('waiting_customer','resolved','closed')) or
    (v_from='waiting_customer' and p_status in ('in_progress','resolved','closed')) or
    (v_from='resolved' and p_status in ('in_progress','closed')) or
    (v_from='closed' and p_status='in_progress')
  ) then raise exception 'Invalid support transition: % -> %',v_from,p_status; end if;
  update public.support_tickets set status=p_status where id=p_ticket_id returning * into v_row;
  perform private.write_audit_actor(p_actor_id,'support_status_change','support_ticket',p_ticket_id::text,'Support ticket status changed',jsonb_build_object('from',v_from,'to',p_status,'comment',v_comment));
  return v_row;
end;$$;
revoke all on function public.server_transition_support_ticket(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.server_transition_support_ticket(uuid,text,uuid,text,text) to service_role;

create or replace function public.server_transition_warranty_claim(
  p_actor_id uuid,
  p_actor_role text,
  p_claim_id uuid,
  p_status text,
  p_resolution_note text default null
)
returns public.warranty_claims
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_row public.warranty_claims%rowtype;
  v_from text;
  v_note text:=nullif(trim(coalesce(p_resolution_note,'')),'');
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if p_status not in ('submitted','reviewing','approved','replacement_processing','rejected','closed') then raise exception 'Invalid warranty status'; end if;
  if v_note is not null and char_length(v_note)>2000 then raise exception 'Warranty resolution note is too long'; end if;
  if p_status in ('rejected','closed') and v_note is null then raise exception 'Resolution note is required'; end if;
  select * into v_row from public.warranty_claims where id=p_claim_id for update;
  if not found then raise exception 'Warranty claim not found'; end if;
  v_from:=v_row.status;
  if v_from=p_status then return v_row; end if;
  if not (
    (v_from='submitted' and p_status in ('reviewing','rejected')) or
    (v_from='reviewing' and p_status in ('approved','rejected')) or
    (v_from='approved' and p_status in ('replacement_processing','closed')) or
    (v_from='replacement_processing' and p_status='closed') or
    (v_from='rejected' and p_status in ('reviewing','closed'))
  ) then raise exception 'Invalid warranty transition: % -> %',v_from,p_status; end if;
  update public.warranty_claims set status=p_status,resolution_note=case when v_note is not null then v_note else resolution_note end where id=p_claim_id returning * into v_row;
  perform private.write_audit_actor(p_actor_id,'warranty_status_change','warranty_claim',p_claim_id::text,'Warranty claim status changed',jsonb_build_object('from',v_from,'to',p_status,'resolution_note',v_note));
  return v_row;
end;$$;
revoke all on function public.server_transition_warranty_claim(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.server_transition_warranty_claim(uuid,text,uuid,text,text) to service_role;

create or replace function public.server_runtime_schema_version()
returns text
language sql
stable
security invoker
set search_path=public,pg_temp
as $$ select '202609110048'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;
