drop index if exists public.payment_attempts_one_active_stripe_checkout_per_order;

create unique index payment_attempts_one_active_checkout_per_order
on public.payment_attempts(order_id)
where status in ('created','pending');
