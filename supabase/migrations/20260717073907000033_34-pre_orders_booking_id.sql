-- Link pre-orders to table bookings

alter table public.pre_orders
  add column if not exists booking_id uuid references public.table_bookings(id) on delete set null;

create index if not exists pre_orders_booking_id_idx
  on public.pre_orders (booking_id)
  where booking_id is not null;
