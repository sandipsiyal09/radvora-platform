alter table public.profiles
  add constraint profiles_full_name_length_check
  check (full_name is null or char_length(full_name) <= 120) not valid;

alter table public.profiles
  add constraint profiles_phone_length_check
  check (phone is null or char_length(phone) <= 32) not valid;

alter table public.profiles validate constraint profiles_full_name_length_check;
alter table public.profiles validate constraint profiles_phone_length_check;
