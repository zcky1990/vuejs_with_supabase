-- Add payment tracking columns
alter table public.transactions
  add column if not exists payment_method text check (payment_method in ('qris', 'cash', 'transfer')),
  add column if not exists paid_at timestamp with time zone;
