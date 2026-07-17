-- Shop payment flow mode for dine-in (pay first vs eat first)

alter table public.shop_config
  add column if not exists payment_flow_mode text not null default 'both'
    check (payment_flow_mode in ('pay_first_only', 'eat_first_only', 'both'));

alter table public.shop_config
  add column if not exists require_table_for_eat_first boolean not null default true;
