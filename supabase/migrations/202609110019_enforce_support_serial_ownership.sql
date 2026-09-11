drop policy if exists users_create_own_support_tickets on public.support_tickets;

create policy users_create_own_support_tickets
on public.support_tickets
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    serial_id is null
    or exists (
      select 1
      from public.product_registrations pr
      where pr.serial_id = support_tickets.serial_id
        and pr.user_id = auth.uid()
    )
  )
);
