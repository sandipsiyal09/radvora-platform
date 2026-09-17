# RADVORA Production Recovery Runbook

This runbook supports release gate #52. It documents the recovery procedure but does **not** itself prove that backup/PITR restore, Vercel rollback, or incident response has been tested. Those gates remain open until performed with genuine platform access and a non-production restore target.

## Safety invariants

During recovery, never:

- mark an order paid manually without provider-authoritative reconciliation;
- release reserved inventory while an authoritative provider session/order still exists;
- bypass GST/HSN, seller-readiness, inventory, refund, scientific-evidence, compliance-review, or AI approval gates;
- weaken founder/admin AAL2 requirements;
- expose Supabase service-role, Razorpay, SMTP, Vercel, or other secrets in source, logs, issues, chat, screenshots, or public variables;
- enable customer payment collection solely to make a health check green.

RADVORA consumer commerce remains India-only and Razorpay-based.

## Current known-good release reference

At the time this runbook was created:

- Git `main`: `b185ae25aa0541bea6d44e27592772c35135c6c0`
- Authoritative runtime schema: `202609140052`
- Production Supabase state: `ACTIVE_HEALTHY`
- Commerce enabled products: `0`
- Auth users: `0`
- Verified MFA factors: `0`
- Seller readiness: `false`

Before every launch-affecting deployment, replace the incident record's known-good reference with the exact signed/verified production commit and current runtime schema. Do not rewrite this historical reference to pretend an unverified deployment is known-good.

## Recovery decision order

1. **Stop further damage without mutating financial truth.** Disable the affected public action or keep commerce fail-closed. Do not edit provider/payment/order states manually.
2. **Identify authoritative systems.** Razorpay is authoritative for live payment/refund state; governed RADVORA inventory/order records must reconcile to provider facts.
3. **Capture evidence.** Record exact Git commit, Supabase runtime schema, deployment ID/URL, failing workflow run, safe health diagnostics, provider event IDs, and timestamps. Do not copy secrets.
4. **Choose the narrowest recovery action.** Prefer disabling the affected feature, reverting/promoting a known-good deployment, or restoring to a non-production target for validation before any production database recovery.
5. **Re-run invariants before reopening traffic.** Health, RLS/privilege lockdown, provider constraints, inventory, seller readiness, scientific/claims controls, and authentication gates must remain fail-closed.

## Supabase backup/PITR restore drill

A production restore drill must be performed to a **non-production** project or approved recovery target. Never destructively test restore against the live production database.

Required evidence before #52 can close:

- production plan backup/PITR capability and retention are confirmed by an authorized Supabase owner;
- a restore point is selected and restored outside production;
- the restored database reaches a healthy state;
- critical schema and security invariants match the expected committed migrations;
- the restore does not weaken RLS or post-deploy privilege lockdown.

### Read-only restore verification queries

Run these against the restored **non-production** database only after the restore completes:

```sql
select public.server_runtime_schema_version() as runtime_schema_version;

select public.server_india_seller_profile_ready() as seller_ready;

select count(*) as auth_users from auth.users;
select count(*) as verified_mfa_factors from auth.mfa_factors where status = 'verified';
select count(*) as commerce_enabled_products from public.products where commerce_enabled is true;
select count(*) as payment_attempts from public.payment_attempts;
select count(*) as payment_webhook_events from public.payment_webhook_events;
```

Then verify release-security invariants using the committed verifier:

`supabase/postdeploy/verify_release_security_invariants.sql`

Do not "repair" mismatches by editing production data until the cause is understood and the committed migration history has been compared to the restored schema.

## Vercel rollback / promote procedure

An authorized Vercel administrator must verify the exact production project and permissions before using these actions.

Preferred procedure:

1. Identify the exact known-good deployment matching the intended Git commit.
2. Inspect its build/deployment metadata.
3. Promote that already-validated deployment when appropriate instead of rebuilding unknown source.
4. If rolling back, point production to the known-good deployment using Vercel's rollback/promote controls.
5. Verify production aliases/domain/TLS resolve to the expected deployment.
6. Re-run `RADVORA Production Health` and require exact commit + schema agreement before declaring recovery complete.

Do not treat a successful Vercel alias change as proof of application/database health.

## Production health recovery check

The repository workflow requires the GitHub Actions variable `PRODUCTION_HEALTH_URL` to be explicitly configured to the genuine canonical HTTPS `/api/health` endpoint. It must not be guessed from a temporary preview URL.

A healthy release must report:

- production environment;
- `main` ref;
- exact expected Git SHA;
- runtime schema `202609140052` (or the later committed authoritative schema after a verified migration);
- healthy database/schema checks;
- commerce activation either deliberately `disabled` or genuinely `ready`;
- canonical production URL configured;
- no unknown diagnostic fields or unsafe response headers.

## Incident ownership matrix

Real accountable people must be assigned before launch. Do not fill these from guesses or unrelated company records.

| Incident | Required owner | Named owner |
| --- | --- | --- |
| Payment mismatch / provider reconciliation | Payments operations owner | **TBD — real person required** |
| Failed Razorpay webhook | Payments/platform owner | **TBD — real person required** |
| Inventory reservation mismatch | Commerce/inventory owner | **TBD — real person required** |
| Database/restore incident | Supabase/database owner | **TBD — real person required** |
| Scientific/health claim incident | Scientific/compliance reviewer | **TBD — real person required** |
| Privileged-account compromise | Security/platform owner | **TBD — real person required** |
| Vercel deployment incident | Deployment/platform owner | **TBD — real person required** |

## Secret rotation readiness

Before launch, authorized owners must confirm that:

- Supabase service-role credentials are stored only in approved server-side secret stores;
- Razorpay live credentials and webhook secrets are stored only in approved production secret stores;
- SMTP credentials are server-side and never public/client-prefixed;
- rotations can be performed without source-code changes;
- old credentials can be revoked after replacement is verified.

Never commit actual secret values to this runbook.

## Recovery completion checklist

Recovery is complete only when all applicable items are true:

- the affected service is stable;
- the exact production Git commit is known and verified;
- the runtime schema matches committed migration history;
- RLS and post-deploy privilege lockdown remain intact;
- founder/admin AAL2 remains enforced;
- Razorpay/provider reconciliation is authoritative for payment/refund state;
- inventory reservations are consistent with provider/order state;
- scientific/claims evidence and human approval gates are intact;
- `RADVORA Production Health` passes on the exact production release;
- the incident record contains evidence and follow-up actions, but no secrets.
