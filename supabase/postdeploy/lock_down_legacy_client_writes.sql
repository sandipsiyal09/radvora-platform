-- Run only AFTER the exact Razorpay production application commit has been verified live.
-- This file is intentionally outside supabase/migrations so an automated migration runner
-- cannot revoke permissions still needed by the currently deployed legacy application.

begin;

-- New checkout uses the explicitly user-scoped SECURITY DEFINER RPC.
revoke execute on function public.checkout_active_cart() from authenticated;
revoke insert on table public.orders from authenticated;
revoke insert on table public.order_items from authenticated;

-- Product registration now uses register_product_serial().
revoke insert on table public.product_registrations from authenticated;

-- Catalog writes are controlled by role-checked RPCs.
revoke insert, update on table public.products from authenticated;

-- Customer support/warranty creation and staff transitions use controlled RPCs.
revoke insert, update on table public.support_tickets from authenticated;
revoke insert, update on table public.warranty_claims from authenticated;

-- High-impact scientific and AI controls now go through authenticated Next.js server routes
-- backed by service-role-only server_* RPCs. Remove their old direct browser RPC surface.
revoke execute on function public.review_claim(uuid,text,text,text) from authenticated;
revoke execute on function public.publish_claim(uuid) from authenticated;
revoke execute on function public.decide_approval(uuid,text,text) from authenticated;
revoke execute on function public.set_agent_configuration(uuid,boolean,smallint,jsonb,jsonb) from authenticated;

commit;

-- After applying, verify:
-- 1. customer cart -> checkout -> Razorpay order creation works;
-- 2. product registration works with serial + private QR token;
-- 3. support and warranty submissions work;
-- 4. admin catalog edits and customer-care transitions work;
-- 5. scientific review/publish, approval decisions and AI configuration work only through server routes;
-- 6. information_schema.role_table_grants shows no obsolete authenticated writes;
-- 7. Supabase security advisor no longer reports the four revoked high-impact RPCs as authenticated-executable.
