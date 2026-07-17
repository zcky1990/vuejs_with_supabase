-- Transaction void / cancel / refund support with audit trail

alter table public.transactions
  add column if not exists status text not null default 'active'
    check (status in ('active', 'cancelled'));

alter table public.transactions
  add column if not exists cancelled_at timestamptz;

alter table public.transactions
  add column if not exists cancelled_by uuid references public.profiles(id);

alter table public.transactions
  add column if not exists cancellation_reason text;

create index if not exists transactions_status_created_idx
  on public.transactions (status, created_at desc);

create table if not exists public.transaction_events (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  event_type text not null check (event_type in ('cancelled')),
  performed_by uuid references public.profiles(id),
  reason text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists transaction_events_transaction_created_idx
  on public.transaction_events (transaction_id, created_at desc);

alter table public.transaction_events enable row level security;

create policy "Allow public read on transaction_events"
  on public.transaction_events for select
  using (true);

create policy "Allow authenticated insert on transaction_events"
  on public.transaction_events for insert
  to authenticated
  with check (true);
