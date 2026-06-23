-- Cashier shifts: opening balance, sales per shift, cash variance at close

create table public.cashier_shifts (
  id uuid default gen_random_uuid() primary key,
  cashier_id uuid not null references auth.users(id),
  shift_date date not null default (timezone('Asia/Jakarta', now()))::date,
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  opening_balance numeric(10, 2) not null check (opening_balance >= 0),
  total_sales numeric(10, 2),
  cash_sales numeric(10, 2),
  qris_sales numeric(10, 2),
  transfer_sales numeric(10, 2),
  transaction_count integer,
  closing_balance_expected numeric(10, 2),
  closing_balance_actual numeric(10, 2),
  cash_variance numeric(10, 2),
  notes text,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create unique index cashier_shifts_one_open_per_user
  on public.cashier_shifts (cashier_id)
  where status = 'open';

create index cashier_shifts_shift_date_idx
  on public.cashier_shifts (shift_date, opened_at desc);

alter table public.transactions
  add column if not exists shift_id uuid references public.cashier_shifts(id) on delete set null;

create index if not exists transactions_shift_id_idx
  on public.transactions (shift_id)
  where shift_id is not null;

alter table public.cashier_shifts enable row level security;

create policy "Allow authenticated read on cashier_shifts"
  on public.cashier_shifts for select
  to authenticated
  using (true);

create policy "Allow authenticated insert on cashier_shifts"
  on public.cashier_shifts for insert
  to authenticated
  with check (cashier_id = auth.uid());

create policy "Allow authenticated update on cashier_shifts"
  on public.cashier_shifts for update
  to authenticated
  using (cashier_id = auth.uid())
  with check (cashier_id = auth.uid());

create trigger set_cashier_shifts_updated_at
  before update on public.cashier_shifts
  for each row
  execute function public.handle_updated_at();
