# RADVORA main protection validation

This file exists only to validate the production `main` branch ruleset before public release.

Validation intent:

- changes to `main` must arrive through a pull request;
- the required `quality` status check must pass;
- the branch must be current before merge;
- force pushes and deletion remain blocked;
- no ordinary bypass actor is configured.

This document does not change application runtime behavior, Supabase schema or data, commerce state, Razorpay configuration, seller/GST identity, HSN/GST treatment, INR pricing, inventory, founder identity, SMTP configuration, scientific evidence, claims controls, AI approval gates, or statutory data.
