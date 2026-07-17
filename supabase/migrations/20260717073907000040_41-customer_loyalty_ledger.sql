-- Audit ledger for customer loyalty point changes

create table if not exists public.customer_point_ledger (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  entry_type text not null check (
    entry_type in ('earn', 'redeem', 'reverse_earn', 'reverse_redeem', 'adjust')
  ),
  points_delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_point_ledger_customer_created_idx
  on public.customer_point_ledger (customer_id, created_at desc);

create index if not exists customer_point_ledger_transaction_idx
  on public.customer_point_ledger (transaction_id)
  where transaction_id is not null;

alter table public.customer_point_ledger enable row level security;

create policy "Allow public read on customer_point_ledger"
  on public.customer_point_ledger for select
  using (true);

create policy "Allow authenticated insert on customer_point_ledger"
  on public.customer_point_ledger for insert
  to authenticated
  with check (true);
