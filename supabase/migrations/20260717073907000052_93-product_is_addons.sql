-- Ganti product_type (menu/addon) menjadi is_addons (boolean)

alter table public.products
  add column if not exists is_addons boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'product_type'
  ) then
    update public.products
    set is_addons = (product_type = 'addon')
    where product_type is not null;

    alter table public.products drop constraint if exists products_product_type_check;
    alter table public.products drop column product_type;
  end if;
end $$;
