-- Invoice customization settings on shop_config

alter table public.shop_config
  add column if not exists invoice_footer_text text,
  add column if not exists invoice_logo_url text,
  add column if not exists invoice_show_logo boolean default false,
  add column if not exists invoice_show_qris boolean default true,
  add column if not exists invoice_tax_id text,
  add column if not exists invoice_show_tax_id boolean default false,
  add column if not exists invoice_terms_text text,
  add column if not exists invoice_show_terms boolean default false,
  add column if not exists invoice_primary_color text default '#000000',
  add column if not exists invoice_show_item_prices boolean default true,
  add column if not exists invoice_show_qty boolean default true;
