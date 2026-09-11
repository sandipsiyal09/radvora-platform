create index if not exists idx_refund_attempts_payment_attempt
  on public.refund_attempts(payment_attempt_id);

create index if not exists idx_refund_attempts_requested_by
  on public.refund_attempts(requested_by);

drop policy if exists refund_attempts_read_owner_or_admin on public.refund_attempts;
create policy refund_attempts_read_owner_or_admin
on public.refund_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = refund_attempts.order_id
      and (
        o.user_id = (select auth.uid())
        or (((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin','founder'))
      )
  )
);

drop policy if exists users_create_own_support_tickets on public.support_tickets;
create policy users_create_own_support_tickets
on public.support_tickets
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    serial_id is null
    or exists (
      select 1
      from public.product_registrations pr
      where pr.serial_id = support_tickets.serial_id
        and pr.user_id = (select auth.uid())
    )
  )
);