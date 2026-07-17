-- Biaya per batch restock + sisa qty untuk FIFO costing.

alter table public.stock_movements
  add column if not exists unit_cost numeric(10, 2) check (unit_cost is null or unit_cost >= 0),
  add column if not exists total_cost numeric(12, 2) check (total_cost is null or total_cost >= 0),
  add column if not exists remaining_quantity integer check (remaining_quantity is null or remaining_quantity >= 0);

-- Backfill batch restock yang sudah ada (asumsikan belum terjual dari batch).
update public.stock_movements
set
  unit_cost = coalesce(unit_cost, 0),
  total_cost = coalesce(total_cost, 0),
  remaining_quantity = coalesce(remaining_quantity, quantity)
where movement_type = 'restock';
