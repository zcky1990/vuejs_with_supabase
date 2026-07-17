-- Stock movement audit log (restock, sale, adjustment)

create table public.stock_movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('restock', 'sale', 'adjustment')),
  quantity integer not null check (quantity > 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  reference_id uuid,
  unit_cost numeric(10, 2) check (unit_cost is null or unit_cost >= 0),
  total_cost numeric(12, 2) check (total_cost is null or total_cost >= 0),
  remaining_quantity integer check (remaining_quantity is null or remaining_quantity >= 0),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index stock_movements_product_created_idx
  on public.stock_movements (product_id, created_at desc);

create index stock_movements_type_created_idx
  on public.stock_movements (movement_type, created_at desc);

alter table public.stock_movements enable row level security;

create policy "Allow public read on stock_movements"
  on public.stock_movements for select
  using (true);

create policy "Allow authenticated insert on stock_movements"
  on public.stock_movements for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on stock_movements"
  on public.stock_movements for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on stock_movements"
  on public.stock_movements for delete
  to authenticated
  using (true);
