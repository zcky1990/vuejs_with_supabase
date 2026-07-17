-- Invoice / receipt header on shop_config

alter table public.shop_config
  add column if not exists shop_name text,
  add column if not exists shop_address text;
