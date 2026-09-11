create unique index if not exists payment_attempts_one_active_stripe_checkout_per_order
on public.payment_attempts (order_id)
where provider = 'stripe' and status in ('created','pending');
