-- RADVORA production release security invariant verifier.
--
-- This script is intentionally read-only. Run it after a verified deployment and
-- after any production schema/privilege change. It must not be used to repair or
-- mutate production state. A single result row is returned with `ok = true` only
-- when the structural security controls below match the expected release model.
--
-- Business/statutory launch readiness (seller identity, Razorpay credentials,
-- INR prices, HSN/GST treatment, governed stock, founder identity, SMTP, etc.) is
-- deliberately NOT inferred here and remains subject to its separate release gates.

with privileged_policy_names(name) as (
  values
    ('admins_read_agent_guardrails'),
    ('admins_read_agent_tool_permissions'),
    ('admins_read_agent_tools'),
    ('admins_read_agent_workflow_steps'),
    ('admins_read_agent_workflows'),
    ('admins_read_agent_runs'),
    ('admins_read_agents'),
    ('admins_read_approvals'),
    ('admins_read_audit_logs'),
    ('admins_read_claim_approvals'),
    ('admins_read_claim_evidence'),
    ('admins_read_leads'),
    ('claims_read_public_or_admin'),
    ('lab_reports_read_public_or_admin'),
    ('rf_tests_read_public_or_admin'),
    ('orders_read_owner_or_admin'),
    ('order_items_read_owner_or_admin'),
    ('payment_attempts_read_owner_or_admin'),
    ('refund_attempts_read_owner_or_admin'),
    ('support_tickets_read_owner_or_admin'),
    ('warranty_claims_read_owner_or_admin'),
    ('admins_insert_products'),
    ('admins_update_products'),
    ('admins_update_support_tickets'),
    ('admins_update_warranty_claims')
),
policy_check as (
  select
    count(*) as found,
    count(*) filter (
      where coalesce(p.qual, '') ilike '%aal2%'
         or coalesce(p.with_check, '') ilike '%aal2%'
    ) as aal2_guarded
  from pg_policies p
  join privileged_policy_names x on x.name = p.policyname
  where p.schemaname = 'public'
),
direct_write_grants as (
  select count(*) as violations
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee = 'authenticated'
    and table_name in (
      'orders',
      'order_items',
      'product_registrations',
      'products',
      'support_tickets',
      'warranty_claims'
    )
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
),
customer_rpc_exposure as (
  select
    count(*) as rpc_count,
    count(*) filter (where has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_exec,
    count(*) filter (where not has_function_privilege('authenticated', p.oid, 'EXECUTE')) as missing_authenticated_exec
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'add_product_to_cart',
      'checkout_active_cart_india',
      'register_product_serial',
      'set_cart_item_quantity',
      'submit_support_ticket',
      'submit_warranty_claim'
    )
),
legacy_privileged_rpc_exposure as (
  select count(*) filter (
    where has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) as authenticated_exec
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'checkout_active_cart',
      'update_product_catalog',
      'set_product_commerce_enabled',
      'set_product_india_tax_config',
      'set_product_inventory',
      'transition_order_fulfillment',
      'transition_support_ticket',
      'transition_warranty_claim',
      'review_claim',
      'publish_claim',
      'decide_approval',
      'set_agent_configuration'
    )
),
checks as (
  select
    public.server_runtime_schema_version() as runtime_schema_version,
    policy_check.found as privileged_policy_count,
    policy_check.aal2_guarded as privileged_policies_with_aal2,
    direct_write_grants.violations as authenticated_direct_sensitive_write_grants,
    customer_rpc_exposure.rpc_count as customer_rpc_count,
    customer_rpc_exposure.anon_exec as customer_rpc_anon_execute_count,
    customer_rpc_exposure.missing_authenticated_exec as customer_rpc_missing_authenticated_execute_count,
    legacy_privileged_rpc_exposure.authenticated_exec as legacy_privileged_rpc_authenticated_execute_count
  from policy_check, direct_write_grants, customer_rpc_exposure, legacy_privileged_rpc_exposure
)
select
  runtime_schema_version,
  privileged_policy_count,
  privileged_policies_with_aal2,
  authenticated_direct_sensitive_write_grants,
  customer_rpc_count,
  customer_rpc_anon_execute_count,
  customer_rpc_missing_authenticated_execute_count,
  legacy_privileged_rpc_authenticated_execute_count,
  (
    runtime_schema_version = '202609110050'
    and privileged_policy_count = 25
    and privileged_policies_with_aal2 = 25
    and authenticated_direct_sensitive_write_grants = 0
    and customer_rpc_count = 6
    and customer_rpc_anon_execute_count = 0
    and customer_rpc_missing_authenticated_execute_count = 0
    and legacy_privileged_rpc_authenticated_execute_count = 0
  ) as ok
from checks;
