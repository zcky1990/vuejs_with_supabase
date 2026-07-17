-- Loyalty fields on transactions

alter table public.transactions
  add column if not exists gross_amount numeric(12, 2);

alter table public.transactions
  add column if not exists loyalty_discount_amount numeric(12, 2) not null default 0
    check (loyalty_discount_amount >= 0);

alter table public.transactions
  add column if not exists loyalty_points_redeemed integer not null default 0
    check (loyalty_points_redeemed >= 0);

alter table public.transactions
  add column if not exists loyalty_points_earned integer not null default 0
    check (loyalty_points_earned >= 0);

-- Backfill gross_amount for existing rows
update public.transactions
set gross_amount = total_amount
where gross_amount is null;
