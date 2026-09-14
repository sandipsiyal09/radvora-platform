-- RADVORA consumer commerce is India-only and Razorpay-only.
-- Historical migrations may reference legacy providers, but new or existing payment
-- attempts must never be able to use any provider other than Razorpay.

begin;

do $$
begin
  if exists (
    select 1
    from public.payment_attempts
    where provider <> 'razorpay'
  ) then
    raise exception 'Cannot enforce Razorpay-only payment attempts while non-Razorpay rows exist';
  end if;
end
$$;

alter table public.payment_attempts
  drop constraint if exists payment_attempts_provider_check;

alter table public.payment_attempts
  add constraint payment_attempts_provider_check
  check (provider = 'razorpay');

create or replace function public.server_runtime_schema_version()
returns text
language sql
stable
security invoker
set search_path=public,pg_temp
as $$ select '202609140051'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;

commit;
