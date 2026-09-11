create table if not exists public.payment_webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  processing_status text not null default 'received' check (processing_status in ('received','processed','ignored','failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  primary key (provider,event_id)
);

alter table public.payment_webhook_events enable row level security;
revoke all on table public.payment_webhook_events from public, anon, authenticated;
grant all on table public.payment_webhook_events to service_role;
create index if not exists payment_webhook_events_received_at_idx on public.payment_webhook_events(received_at desc);
