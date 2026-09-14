begin;

do $$
begin
  if exists (select 1 from public.payment_webhook_events where provider <> 'razorpay') then
    raise exception 'Non-Razorpay webhook rows must be reconciled before provider constraint';
  end if;
  if exists (select 1 from public.orders where payment_provider is not null and payment_provider <> 'razorpay') then
    raise exception 'Non-Razorpay order provider rows must be reconciled before provider constraint';
  end if;
end
$$;

alter table public.payment_webhook_events drop constraint if exists payment_webhook_events_provider_check;
alter table public.payment_webhook_events add constraint payment_webhook_events_provider_check check (provider = 'razorpay');

alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check check (payment_provider is null or payment_provider = 'razorpay');

create or replace function public.server_runtime_schema_version()
returns text
language sql
stable
security invoker
set search_path=public,pg_temp
as $$ select '202609140052'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;

commit;
