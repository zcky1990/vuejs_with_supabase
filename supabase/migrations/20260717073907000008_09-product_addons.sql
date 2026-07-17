-- Mapping addon + addon per baris transaksi

alter table public.products
  add column if not exists is_addons boolean not null default false;

create table if not exists public.product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  addon_product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  unique (product_id, addon_product_id),
  check (product_id <> addon_product_id)
);

create index if not exists product_addons_product_id_idx
  on public.product_addons (product_id, sort_order);

create table if not exists public.transaction_item_addons (
  id uuid primary key default gen_random_uuid(),
  transaction_item_id uuid not null references public.transaction_items(id) on delete cascade,
  addon_product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists transaction_item_addons_item_id_idx
  on public.transaction_item_addons (transaction_item_id);

alter table public.product_addons enable row level security;
alter table public.transaction_item_addons enable row level security;

create policy "Allow public read on product_addons"
  on public.product_addons for select
  using (true);

create policy "Allow authenticated insert on product_addons"
  on public.product_addons for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on product_addons"
  on public.product_addons for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on product_addons"
  on public.product_addons for delete
  to authenticated
  using (true);

create policy "Allow public read on transaction_item_addons"
  on public.transaction_item_addons for select
  using (true);

create policy "Allow authenticated insert on transaction_item_addons"
  on public.transaction_item_addons for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on transaction_item_addons"
  on public.transaction_item_addons for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on transaction_item_addons"
  on public.transaction_item_addons for delete
  to authenticated
  using (true);
