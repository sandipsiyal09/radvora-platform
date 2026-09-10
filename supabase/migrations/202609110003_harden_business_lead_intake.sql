-- Business leads are accepted through the server-controlled Next.js API.
-- Keep the legacy SECURITY DEFINER RPC unavailable to Data API client roles.
revoke all on function public.submit_business_lead(text,text,text,text,text,text) from public;
revoke all on function public.submit_business_lead(text,text,text,text,text,text) from anon;
revoke all on function public.submit_business_lead(text,text,text,text,text,text) from authenticated;

alter table public.leads
  add constraint leads_full_name_length_check check (full_name is null or char_length(full_name) between 2 and 120),
  add constraint leads_email_length_check check (email is null or char_length(email) <= 320),
  add constraint leads_phone_length_check check (phone is null or char_length(phone) <= 40),
  add constraint leads_company_length_check check (company is null or char_length(company) <= 160),
  add constraint leads_source_length_check check (source is null or char_length(source) <= 80),
  add constraint leads_notes_length_check check (notes is null or char_length(notes) <= 3000);
