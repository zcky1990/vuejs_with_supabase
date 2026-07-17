-- Run this in Supabase SQL editor if insert/update/delete returns 403

drop policy if exists "Allow authenticated insert on products" on public.products;
drop policy if exists "Allow authenticated update on products" on public.products;
drop policy if exists "Allow authenticated delete on products" on public.products;

drop policy if exists "Allow authenticated insert on customers" on public.customers;
drop policy if exists "Allow authenticated update on customers" on public.customers;
drop policy if exists "Allow authenticated delete on customers" on public.customers;

create policy "Allow authenticated insert on products"
  on public.products for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on products"
  on public.products for delete
  to authenticated
  using (true);

create policy "Allow authenticated insert on customers"
  on public.customers for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on customers"
  on public.customers for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on customers"
  on public.customers for delete
  to authenticated
  using (true);
