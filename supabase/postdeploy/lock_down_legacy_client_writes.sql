-- Run only AFTER the exact India-commerce production application commit has been verified live.
-- This file is intentionally outside supabase/migrations so an automated migration runner
-- cannot revoke permissions still needed by the currently deployed legacy application.

begin;

-- New checkout uses the explicitly user-scoped checkout_active_cart_india() RPC from the
-- authenticated server route. Remove only the obsolete legacy checkout RPC/direct inserts.
revoke execute on function public.checkout_active_cart() from authenticated;
revoke insert on table public.orders from authenticated;
revoke insert on table public.order_items from authenticated;

-- Product registration now uses register_product_serial().
revoke insert on table public.product_registrations from authenticated;

-- Catalog/inventory mutations now pass through authenticated Next.js server routes backed by
-- service-role-only server_* RPCs. Remove obsolete direct table writes and legacy browser RPCs.
revoke insert, update on table public.products from authenticated;
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'update_product_catalog',
        'set_product_commerce_enabled',
        'set_product_india_tax_config',
        'set_product_inventory'
      )
  loop
    execute format('revoke execute on function %s from authenticated',r.signature);
  end loop;
end $$;

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
-- 1. customer cart -> checkout -> expiring Razorpay Payment Link creation/reuse works;
-- 2. payment_link.paid / payment_link.cancelled / payment_link.expired webhooks reconcile correctly;
-- 3. product registration works with serial + private QR token;
-- 4. support and warranty submissions work;
-- 5. admin catalog, GST/HSN, commerce and governed inventory controls work only through server routes;
-- 6. customer-care transitions work;
-- 7. scientific review/publish, approval decisions and AI configuration work only through server routes;
-- 8. information_schema.role_table_grants shows no obsolete authenticated writes;
-- 9. routine authenticated users can no longer execute the revoked legacy catalog/scientific/AI RPCs;
-- 10. /api/health reports database, commerce_schema and payment_session_schema = ok;
-- 11. Supabase security/performance advisors are re-run and reviewed.
