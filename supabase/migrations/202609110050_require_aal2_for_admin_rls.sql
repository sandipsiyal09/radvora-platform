-- Defense in depth for privileged sessions.
-- Founder/admin access through Supabase REST must require both the privileged role
-- and an AAL2 JWT. Customer owner reads and public published-evidence reads remain
-- available at their existing assurance levels.

-- Admin-only read policies.
drop policy if exists admins_read_agent_guardrails on public.agent_guardrails;
create policy admins_read_agent_guardrails on public.agent_guardrails
for select to authenticated
using (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal') = 'aal2'
);

drop policy if exists admins_read_agent_tool_permissions on public.agent_tool_permissions;
create policy admins_read_agent_tool_permissions on public.agent_tool_permissions
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_agent_tools on public.agent_tools;
create policy admins_read_agent_tools on public.agent_tools
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_agent_workflow_steps on public.agent_workflow_steps;
create policy admins_read_agent_workflow_steps on public.agent_workflow_steps
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_agent_workflows on public.agent_workflows;
create policy admins_read_agent_workflows on public.agent_workflows
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_agent_runs on public.ai_agent_runs;
create policy admins_read_agent_runs on public.ai_agent_runs
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_agents on public.ai_agents;
create policy admins_read_agents on public.ai_agents
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_approvals on public.approvals;
create policy admins_read_approvals on public.approvals
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_audit_logs on public.audit_logs;
create policy admins_read_audit_logs on public.audit_logs
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_claim_approvals on public.claim_approvals;
create policy admins_read_claim_approvals on public.claim_approvals
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_claim_evidence on public.claim_evidence;
create policy admins_read_claim_evidence on public.claim_evidence
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

drop policy if exists admins_read_leads on public.leads;
create policy admins_read_leads on public.leads
for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder') and ((select auth.jwt())->>'aal')='aal2');

-- Public published evidence remains public; privileged access to non-public rows requires AAL2.
drop policy if exists claims_read_public_or_admin on public.claims;
create policy claims_read_public_or_admin on public.claims
for select to anon, authenticated
using (
  (status='published' and category<>'health')
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

drop policy if exists lab_reports_read_public_or_admin on public.lab_reports;
create policy lab_reports_read_public_or_admin on public.lab_reports
for select to anon, authenticated
using (
  status='published'
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

drop policy if exists rf_tests_read_public_or_admin on public.rf_tests;
create policy rf_tests_read_public_or_admin on public.rf_tests
for select to anon, authenticated
using (
  status='published'
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

-- Customer owner reads remain available; only the admin branch requires AAL2.
drop policy if exists orders_read_owner_or_admin on public.orders;
create policy orders_read_owner_or_admin on public.orders
for select to authenticated
using (
  (select auth.uid())=user_id
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

drop policy if exists order_items_read_owner_or_admin on public.order_items;
create policy order_items_read_owner_or_admin on public.order_items
for select to authenticated
using (
  exists(select 1 from public.orders o where o.id=order_items.order_id and o.user_id=(select auth.uid()))
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

drop policy if exists payment_attempts_read_owner_or_admin on public.payment_attempts;
create policy payment_attempts_read_owner_or_admin on public.payment_attempts
for select to authenticated
using (
  exists(select 1 from public.orders o where o.id=payment_attempts.order_id and o.user_id=(select auth.uid()))
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

drop policy if exists refund_attempts_read_owner_or_admin on public.refund_attempts;
create policy refund_attempts_read_owner_or_admin on public.refund_attempts
for select to authenticated
using (
  exists(
    select 1 from public.orders o
    where o.id=refund_attempts.order_id
      and (
        o.user_id=(select auth.uid())
        or (
          ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
          and ((select auth.jwt())->>'aal')='aal2'
        )
      )
  )
);

drop policy if exists support_tickets_read_owner_or_admin on public.support_tickets;
create policy support_tickets_read_owner_or_admin on public.support_tickets
for select to authenticated
using (
  (select auth.uid())=user_id
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

drop policy if exists warranty_claims_read_owner_or_admin on public.warranty_claims;
create policy warranty_claims_read_owner_or_admin on public.warranty_claims
for select to authenticated
using (
  (select auth.uid())=user_id
  or (
    ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
    and ((select auth.jwt())->>'aal')='aal2'
  )
);

-- These direct-write grants are revoked by post-deploy lockdown today, but keep
-- the policies AAL2-safe in case a future migration accidentally restores grants.
drop policy if exists admins_insert_products on public.products;
create policy admins_insert_products on public.products
for insert to authenticated
with check (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
);

drop policy if exists admins_update_products on public.products;
create policy admins_update_products on public.products
for update to authenticated
using (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
)
with check (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
);

drop policy if exists admins_update_support_tickets on public.support_tickets;
create policy admins_update_support_tickets on public.support_tickets
for update to authenticated
using (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
)
with check (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
);

drop policy if exists admins_update_warranty_claims on public.warranty_claims;
create policy admins_update_warranty_claims on public.warranty_claims
for update to authenticated
using (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
)
with check (
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','founder')
  and ((select auth.jwt())->>'aal')='aal2'
);

create or replace function public.server_runtime_schema_version()
returns text
language sql
stable
security invoker
set search_path=public,pg_temp
as $$ select '202609110050'::text; $$;
revoke all on function public.server_runtime_schema_version() from public,anon,authenticated;
grant execute on function public.server_runtime_schema_version() to service_role;
