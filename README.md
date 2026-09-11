# RADVORA Platform

Premium consumer-tech and digital-wellness platform for RADVORA Technologies.

## Build direction

- Next.js + React + TypeScript
- Premium 3D interactive design system
- Product catalog and ShieldTag experience
- RADVORA Labs and claims governance
- QR verification and compatibility
- CRM, commerce and customer accounts
- Autonomous AI company command center

> Scientific and RF performance claims must be tied to approved test evidence. No unsupported medical or health-protection claims.

## India commerce production activation

Consumer commerce is intentionally India-first and remains disabled until all production prerequisites are satisfied.

Required server/runtime configuration:

- `NEXT_PUBLIC_APP_URL` — canonical HTTPS production origin.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` — server only; never expose with `NEXT_PUBLIC_`.
- `RAZORPAY_KEY_ID` — live merchant key ID.
- `RAZORPAY_KEY_SECRET` — live merchant secret, server only.
- `RAZORPAY_WEBHOOK_SECRET` — dedicated webhook signing secret, server only.

Razorpay webhook endpoint after production deployment:

`https://<production-domain>/api/webhooks/razorpay`

Required webhook events for the current India checkout:

- `payment_link.paid`
- `payment_link.cancelled`
- `payment_link.expired`
- `refund.processed`
- `refund.failed`

`payment.captured` remains accepted only as a backward-compatible reconciliation event for any pre-Payment-Link Razorpay attempt already recorded; new customer checkout does not create open-ended Razorpay Orders directly.

The webhook must use the same secret configured in `RAZORPAY_WEBHOOK_SECRET`. Payment and refund completion are reconciled on the server from signed/provider-authoritative data; callback query parameters and browser redirects are never sufficient to mark an order paid or refunded.

### Expiring provider session model

New checkout creates a Standard Razorpay Payment Link with a 30-minute expiry. The internal `payment_attempts.id` is used as Razorpay `reference_id`, allowing RADVORA to recover a provider session after an uncertain network response before creating anything new.

The application stores the Payment Link identifier, hosted URL and expiry against the payment attempt. If the link is paid, the signed webhook reconciles the exact link, attempt, internal order, captured payment, INR amount, GST/accounting snapshots and inventory reservation before marking the order paid. If the link is cancelled or expires with no payment, a signed/provider-confirmed close releases reserved inventory and cancels the unpaid internal order.

Customer self-service cancellation first fetches/cancels the exact provider Payment Link and only then releases inventory. Inventory is never released merely because a local timer elapsed or a local attempt was labelled failed.

### Product activation rule

A catalog product is not sellable merely because it is visible or has a price. India consumer sales require all of the following:

1. Product status is `active`.
2. Currency is `INR`.
3. Approved `price_inr` is greater than zero.
4. An approved 4–8 digit HSN code is configured.
5. The approved GST rate is configured explicitly.
6. The catalog explicitly records whether `price_inr` includes or excludes GST.
7. Governed `stock_on_hand` is configured and available stock (`stock_on_hand - stock_reserved`) is greater than zero.
8. Founder/admin explicitly enables `commerce_enabled` after reviewing price, statutory tax configuration and inventory.

Saving catalog data, GST/HSN configuration or governed inventory automatically disables commerce so the product must be reviewed again before sales resume. Existing products default to `commerce_enabled = false`. Do not invent production prices, GST rates, HSN codes, stock quantities, seller GSTIN, place-of-supply treatment or other statutory data in code.

### Tax and inventory snapshots

At checkout the server snapshots HSN, GST rate, GST-inclusive/exclusive treatment, taxable value, tax amount and gross line total into `order_items`. Payment initialization refuses orders with missing or internally inconsistent tax snapshots. Historical order tax snapshots must not be recalculated from the live catalog after purchase.

Checkout also locks the governed product rows and atomically reserves the ordered quantity. A provider-confirmed cancelled/expired Payment Link releases an unpaid reservation. A full refund before shipment releases reserved stock. When an order is marked shipped, reserved quantity is consumed from physical stock. Cart mutation checks available stock for early feedback, but checkout remains the final concurrency-safe reservation authority.

### Database release rule

All committed Supabase migrations through the exact release head must be applied before enabling checkout. In particular, India tax configuration, line-level rounding/reconciliation, atomic inventory reservation, server-only catalog/inventory controls, payment-capture invariants, and expiring Payment Link session migrations must all be present before Razorpay payment collection is enabled. Never enable customer payment collection against an application/schema version mismatch.

### Pre-release verification

Before merging a production commerce change:

1. GitHub Quality Gate must install from the committed `package-lock.json` using `npm ci`.
2. Production dependency audit must have no high or critical finding.
3. TypeScript/typecheck and the production Next.js build must pass for the exact PR head.
4. Migration filenames must have unique ordered versions and every required Supabase migration for the exact head must be applied.
5. Supabase security advisors must be reviewed after DDL changes.
6. Production data invariants must show no duplicate active carts/payments, impossible inventory reservations, or unresolved payment/refund reconciliation anomalies.
7. No commerce-enabled product may be missing positive INR pricing, explicit GST/HSN configuration, or available governed inventory.
8. Razorpay webhook subscriptions must include the Payment Link paid/cancelled/expired events and refund processed/failed events listed above.
9. Vercel preview must successfully build the exact latest PR head when deployment capacity is available.
10. Only after preview validation should the PR merge and the exact merge commit be verified in production.

Vercel quota/rate limits are deployment blockers only; they must not be worked around by merging unverified code. While a deployment gate is blocked, continue non-deployment engineering and validation work rather than weakening the gate.

### Post-deploy privilege lockdown

After the exact merged application commit is verified live, apply `supabase/postdeploy/lock_down_legacy_client_writes.sql` and re-test checkout, product registration, support/warranty submission, admin catalog/inventory updates, and customer-care transitions. This revokes obsolete direct authenticated writes only after the replacement RPC workflows are live.

Do not move this post-deploy SQL into the automatic migration chain: the currently deployed legacy application still needs some of those grants until the new application version is running in production.
