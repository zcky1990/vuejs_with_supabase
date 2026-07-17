-- Tulis master data & pengaturan: hanya owner

-- products
drop policy if exists "Allow authenticated insert on products" on public.products;
drop policy if exists "Allow authenticated update on products" on public.products;
drop policy if exists "Allow authenticated delete on products" on public.products;

create policy "Owner insert on products"
  on public.products for insert to authenticated
  with check (public.is_owner());

create policy "Owner update on products"
  on public.products for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner delete on products"
  on public.products for delete to authenticated
  using (public.is_owner());

-- product_categories
drop policy if exists "Allow authenticated insert on product_categories" on public.product_categories;
drop policy if exists "Allow authenticated update on product_categories" on public.product_categories;
drop policy if exists "Allow authenticated delete on product_categories" on public.product_categories;

create policy "Owner insert on product_categories"
  on public.product_categories for insert to authenticated
  with check (public.is_owner());

create policy "Owner update on product_categories"
  on public.product_categories for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner delete on product_categories"
  on public.product_categories for delete to authenticated
  using (public.is_owner());

-- customers (walk-in tetap bisa dibaca semua)
drop policy if exists "Allow authenticated insert on customers" on public.customers;
drop policy if exists "Allow authenticated update on customers" on public.customers;
drop policy if exists "Allow authenticated delete on customers" on public.customers;

create policy "Owner insert on customers"
  on public.customers for insert to authenticated
  with check (public.is_owner());

create policy "Owner update on customers"
  on public.customers for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner delete on customers"
  on public.customers for delete to authenticated
  using (public.is_owner());

-- shop_config (jika tabel ada)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'shop_config'
  ) then
    execute 'drop policy if exists "Allow authenticated update on shop_config" on public.shop_config';
    execute 'drop policy if exists "Allow authenticated insert on shop_config" on public.shop_config';
    execute $p$
      create policy "Owner update on shop_config"
        on public.shop_config for update to authenticated
        using (public.is_owner())
        with check (public.is_owner())
    $p$;
    execute $p$
      create policy "Owner insert on shop_config"
        on public.shop_config for insert to authenticated
        with check (public.is_owner())
    $p$;
  end if;
end $$;

-- restock: staff tidak boleh insert stock_movements (jika policy ada)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'stock_movements'
  ) then
    execute 'drop policy if exists "Allow authenticated insert on stock_movements" on public.stock_movements';
    execute $p$
      create policy "Owner insert on stock_movements"
        on public.stock_movements for insert to authenticated
        with check (public.is_owner())
    $p$;
  end if;
end $$;
