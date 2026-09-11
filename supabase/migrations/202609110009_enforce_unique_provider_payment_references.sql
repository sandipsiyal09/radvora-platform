create unique index if not exists payment_attempts_provider_order_unique
on public.payment_attempts(provider,provider_order_id)
where provider_order_id is not null;

create unique index if not exists payment_attempts_provider_payment_unique
on public.payment_attempts(provider,provider_payment_id)
where provider_payment_id is not null;
