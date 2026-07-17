-- Menu category visibility and display order for /order and cashier

alter table public.shop_config
  add column if not exists menu_category_ids uuid[];
