alter table public.warranty_claims
  add constraint warranty_claims_issue_type_check
  check (issue_type = any (array['product_issue'::text,'adhesive_issue'::text,'physical_damage'::text,'other'::text])) not valid;

alter table public.warranty_claims validate constraint warranty_claims_issue_type_check;
