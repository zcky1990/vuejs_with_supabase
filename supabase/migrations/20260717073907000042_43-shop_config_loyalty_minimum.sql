-- Minimum gross transaction amount required to earn loyalty points

alter table public.shop_config
  add column if not exists loyalty_minimum_transaction_amount numeric(12, 2) not null default 0
    check (loyalty_minimum_transaction_amount >= 0);
