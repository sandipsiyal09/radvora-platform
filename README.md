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

1. GitHub Quality Gate must pass TypeScript/typecheck and the production Next.js build for the exact PR head.
2. Supabase migrations must be applied and security advisors reviewed.
3. Vercel preview must successfully build the exact latest PR head when deployment capacity is available.
4. Only after preview validation should the PR merge and the exact merge commit be verified in production.

Vercel quota/rate limits are deployment blockers only; they must not be worked around by merging unverified code.
