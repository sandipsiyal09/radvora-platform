alter table public.orders
  add column if not exists checkout_terms_accepted_at timestamptz,
  add column if not exists checkout_terms_version text;

alter table public.orders
  add constraint orders_checkout_terms_version_length
  check (checkout_terms_version is null or char_length(checkout_terms_version) <= 64) not valid;

alter table public.orders validate constraint orders_checkout_terms_version_length;
