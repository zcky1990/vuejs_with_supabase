-- Alokasi FIFO: penjualan mengambil stok dari batch restock tertentu.

create table if not exists public.stock_lot_allocations (
  id uuid default gen_random_uuid() primary key,
  sale_movement_id uuid not null references public.stock_movements(id) on delete cascade,
  lot_movement_id uuid not null references public.stock_movements(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(10, 2) not null check (unit_cost >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists stock_lot_allocations_sale_idx
  on public.stock_lot_allocations (sale_movement_id);

create index if not exists stock_lot_allocations_lot_idx
  on public.stock_lot_allocations (lot_movement_id);

alter table public.stock_lot_allocations enable row level security;

create policy "Allow public read on stock_lot_allocations"
  on public.stock_lot_allocations for select
  using (true);

create policy "Allow authenticated insert on stock_lot_allocations"
  on public.stock_lot_allocations for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on stock_lot_allocations"
  on public.stock_lot_allocations for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on stock_lot_allocations"
  on public.stock_lot_allocations for delete
  to authenticated
  using (true);
