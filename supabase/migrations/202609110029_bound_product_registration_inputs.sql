create or replace function public.register_product_serial(p_serial text, p_qr_token text)
returns table(registration_id uuid, serial_id uuid, serial_number text, status text)
language plpgsql
security definer
set search_path = 'public', 'extensions', 'pg_temp'
as $$
declare
  v_user uuid := auth.uid();
  v_serial public.product_serials%rowtype;
  v_registration uuid;
  v_token_hash text;
  v_serial_input text := upper(trim(coalesce(p_serial,'')));
  v_token_input text := trim(coalesce(p_qr_token,''));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if char_length(v_serial_input) < 5 or char_length(v_serial_input) > 64 or v_serial_input !~ '^[A-Z0-9][A-Z0-9-]{4,63}$' then
    raise exception 'Serial or authentication token is invalid';
  end if;
  if char_length(v_token_input) < 16 or char_length(v_token_input) > 512 then
    raise exception 'Serial or authentication token is invalid';
  end if;
  v_token_hash := encode(extensions.digest(v_token_input,'sha256'),'hex');

  select * into v_serial
  from public.product_serials
  where upper(serial_number)=v_serial_input
  for update;

  if not found then raise exception 'Serial or authentication token is invalid'; end if;
  if v_serial.qr_token_hash <> v_token_hash then raise exception 'Serial or authentication token is invalid'; end if;
  if v_serial.status in ('revoked','returned') then raise exception 'Serial is not eligible for registration'; end if;
  if v_serial.activated_by is not null and v_serial.activated_by <> v_user then raise exception 'Serial is already registered'; end if;

  insert into public.product_registrations(user_id,serial_id)
  values(v_user,v_serial.id)
  on conflict(serial_id) do nothing
  returning id into v_registration;

  if v_registration is null then
    select id into v_registration from public.product_registrations where serial_id=v_serial.id and user_id=v_user;
  end if;
  if v_registration is null then raise exception 'Serial is already registered'; end if;

  update public.product_serials
  set status='activated',activated_by=v_user,activated_at=coalesce(activated_at,now())
  where id=v_serial.id;

  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,summary,metadata)
  values(v_user,'product_register','product_serial',v_serial.id::text,'Registered authenticated product serial',jsonb_build_object('serial_number',v_serial.serial_number));

  return query select v_registration,v_serial.id,v_serial.serial_number,'activated'::text;
end;
$$;
