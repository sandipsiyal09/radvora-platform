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

Required webhook events:

- `payment.captured`
- `refund.processed`
- `refund.failed`

The webhook must use the same secret configured in `RAZORPAY_WEBHOOK_SECRET`. Payment and refund completion are reconciled on the server from signed/provider-authoritative data; browser callbacks are not sufficient to mark an order paid or refunded.

### Product activation rule

A catalog product is not sellable merely because it is visible or has a price. India consumer sales require all of the following:

1. Product status is `active`.
2. Currency is `INR`.
3. Approved `price_inr` is greater than zero.
4. Founder/admin explicitly enables `commerce_enabled` from the internal catalog controls.

Existing products default to `commerce_enabled = false`. Do not invent production prices, GST rates, HSN codes, stock quantities, or statutory seller data in code.

### Pre-release verification

Before merging a production commerce change:

1. GitHub Quality Gate must install from the committed `package-lock.json` using `npm ci`.
2. Production dependency audit must have no high or critical finding.
3. TypeScript/typecheck and the production Next.js build must pass for the exact PR head.
4. Supabase migrations must be applied and security advisors reviewed.
5. Production data invariants must show no duplicate active carts/payments or unresolved payment/refund reconciliation anomalies.
6. Vercel preview must successfully build the exact latest PR head when deployment capacity is available.
7. Only after preview validation should the PR merge and the exact merge commit be verified in production.

Vercel quota/rate limits are deployment blockers only; they must not be worked around by merging unverified code. While a deployment gate is blocked, continue non-deployment engineering and validation work rather than weakening the gate.

### Post-deploy privilege lockdown

After the exact merged application commit is verified live, apply `supabase/postdeploy/lock_down_legacy_client_writes.sql` and re-test checkout, product registration, support/warranty submission, admin catalog updates, and customer-care transitions. This revokes obsolete direct authenticated writes only after the replacement RPC workflows are live.

Do not move this post-deploy SQL into the automatic migration chain: the currently deployed legacy application still needs some of those grants until the new Razorpay application version is running in production.
