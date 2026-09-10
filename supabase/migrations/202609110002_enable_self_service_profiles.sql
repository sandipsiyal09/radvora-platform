begin;

alter table public.profiles
  add constraint profiles_full_name_length_check
  check (full_name is null or char_length(full_name) <= 120) not valid;

alter table public.profiles
  add constraint profiles_phone_length_check
  check (phone is null or char_length(phone) <= 32) not valid;

create policy users_insert_own_profile
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

commit;
