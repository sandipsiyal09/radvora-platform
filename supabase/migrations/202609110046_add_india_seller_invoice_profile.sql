create table if not exists public.india_seller_profile (
  profile_key text primary key check (profile_key='primary'),
  legal_name text,
  gstin text,
  registered_state text,
  registered_state_code text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  support_email text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.india_seller_profile enable row level security;
revoke all on table public.india_seller_profile from public,anon,authenticated;
grant all on table public.india_seller_profile to service_role;

alter table public.india_seller_profile drop constraint if exists india_seller_profile_legal_name_length;
alter table public.india_seller_profile add constraint india_seller_profile_legal_name_length check (legal_name is null or char_length(legal_name) between 2 and 200);
alter table public.india_seller_profile drop constraint if exists india_seller_profile_gstin_format;
alter table public.india_seller_profile add constraint india_seller_profile_gstin_format check (gstin is null or gstin ~ '^[0-9]{2}[A-Z0-9]{13}$');
alter table public.india_seller_profile drop constraint if exists india_seller_profile_state_code_format;
alter table public.india_seller_profile add constraint india_seller_profile_state_code_format check (registered_state_code is null or registered_state_code ~ '^[0-9]{2}$');
alter table public.india_seller_profile drop constraint if exists india_seller_profile_postal_code_format;
alter table public.india_seller_profile add constraint india_seller_profile_postal_code_format check (postal_code is null or postal_code ~ '^[1-9][0-9]{5}$');
alter table public.india_seller_profile drop constraint if exists india_seller_profile_email_length;
alter table public.india_seller_profile add constraint india_seller_profile_email_length check (support_email is null or char_length(support_email)<=320);

insert into public.india_seller_profile(profile_key)
values('primary')
on conflict(profile_key) do nothing;

create or replace function public.server_set_india_seller_profile(
  p_actor_id uuid,
  p_actor_role text,
  p_legal_name text,
  p_gstin text,
  p_registered_state text,
  p_registered_state_code text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_postal_code text,
  p_support_email text
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
begin
  if p_actor_id is null or p_actor_role not in ('admin','founder') then raise exception 'Admin access required'; end if;
  if char_length(v_legal_name)<2 or char_length(v_legal_name)>200 then raise exception 'Invalid seller legal name'; end if;
  if v_gstin !~ '^[0-9]{2}[A-Z0-9]{13}$' then raise exception 'GSTIN must be a 15-character uppercase alphanumeric identifier beginning with a two-digit state code'; end if;
  if v_state_code !~ '^[0-9]{2}$' or left(v_gstin,2)<>v_state_code then raise exception 'Registered state code must match the first two digits of GSTIN'; end if;
  if char_length(v_state)<2 or char_length(v_state)>100 then raise exception 'Invalid registered state'; end if;
  if char_length(v_line1)<5 or char_length(v_line1)>180 then raise exception 'Invalid registered address'; end if;
  if v_line2 is not null and char_length(v_line2)>180 then raise exception 'Address line 2 is too long'; end if;
  if char_length(v_city)<2 or char_length(v_city)>100 then raise exception 'Invalid city'; end if;
  if v_postal !~ '^[1-9][0-9]{5}$' then raise exception 'Invalid postal code'; end if;
  if char_length(v_email)<3 or char_length(v_email)>320 or position('@' in v_email)<2 then raise exception 'Invalid support email'; end if;

  insert into public.india_seller_profile(profile_key,legal_name,gstin,registered_state,registered_state_code,address_line1,address_line2,city,postal_code,support_email,updated_by,updated_at)
  values('primary',v_legal_name,v_gstin,v_state,v_state_code,v_line1,v_line2,v_city,v_postal,v_email,p_actor_id,now())
  on conflict(profile_key) do update set
    legal_name=excluded.legal_name,
    gstin=excluded.gstin,
    registered_state=excluded.registered_state,
    registered_state_code=excluded.registered_state_code,
    address_line1=excluded.address_line1,
    address_line2=excluded.address_line2,
    city=excluded.city,
    postal_code=excluded.postal_code,
    support_email=excluded.support_email,
    updated_by=excluded.updated_by,
    updated_at=now()
  returning * into v_row;

  update public.products set commerce_enabled=false,updated_at=now() where commerce_enabled=true;
  perform private.write_audit_actor(p_actor_id,'india_seller_profile_update','commerce','india-primary','Updated India seller/invoice identity; commerce disabled pending review',jsonb_build_object('gstin',v_gstin,'registered_state_code',v_state_code));
  return v_row;
end;$$;

revoke all on function public.server_set_india_seller_profile(uuid,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.server_set_india_seller_profile(uuid,text,text,text,text,text,text,text,text,text,text) to service_role;

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
  );
$$;
revoke all on function public.server_india_seller_profile_ready() from public,anon,authenticated;
grant execute on function public.server_india_seller_profile_ready() to service_role;

create or replace function public.server_runtime_schema_version()
returns text
language sql
stable
security invoker
set search_path=public,pg_temp
as $$ select '202609110046'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;
