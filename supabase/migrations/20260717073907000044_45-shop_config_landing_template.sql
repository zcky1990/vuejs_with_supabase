-- Landing page template selector

alter table public.shop_config
  add column if not exists landing_template text default 'default';
