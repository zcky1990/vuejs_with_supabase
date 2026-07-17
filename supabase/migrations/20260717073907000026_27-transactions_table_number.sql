-- Open tab per table for dine-in eat-first flow

alter table public.transactions
  add column if not exists table_number text;

create index if not exists transactions_open_tab_idx
  on public.transactions (table_number, is_paid, created_at desc)
  where is_paid = false and status = 'active';
