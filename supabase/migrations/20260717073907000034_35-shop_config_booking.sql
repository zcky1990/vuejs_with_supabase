-- Table booking settings on shop_config

alter table public.shop_config
  add column if not exists enable_table_booking boolean not null default false;

alter table public.shop_config
  add column if not exists booking_duration_minutes integer not null default 120;

alter table public.shop_config
  add column if not exists booking_advance_days_max integer not null default 30;

alter table public.shop_config
  add column if not exists booking_open_time time not null default '10:00';

alter table public.shop_config
  add column if not exists booking_close_time time not null default '22:00';

alter table public.shop_config
  add column if not exists booking_auto_confirm boolean not null default true;
