-- Default harga beli produk (untuk pre-fill restock berikutnya).
-- Harga per batch restock disimpan di stock_movements.unit_cost.

alter table public.products
  add column if not exists purchase_price numeric(10, 2) not null default 0 check (purchase_price >= 0);
