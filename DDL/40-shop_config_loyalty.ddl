-- Loyalty program settings on shop_config

alter table public.shop_config
  add column if not exists loyalty_enabled boolean not null default false;

alter table public.shop_config
  add column if not exists loyalty_points_per_transaction integer not null default 0
    check (loyalty_points_per_transaction >= 0);

alter table public.shop_config
  add column if not exists loyalty_point_redeem_value numeric(12, 2) not null default 0
    check (loyalty_point_redeem_value >= 0);
