-- Public serial verification is served through the server-side
-- /api/product-verification endpoint. Keep the underlying view unavailable
-- to browser roles so product serials cannot be enumerated directly through
-- the Supabase Data API.

revoke all privileges on table public.public_product_verification from public;
revoke all privileges on table public.public_product_verification from anon;
revoke all privileges on table public.public_product_verification from authenticated;

grant select on table public.public_product_verification to service_role;
