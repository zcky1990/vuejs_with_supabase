-- Scheduled table bookings (whole table)

create table public.table_bookings (
  id uuid default gen_random_uuid() primary key,
  dining_table_id uuid not null references public.dining_tables(id) on delete restrict,
  table_number text not null,
  customer_name text,
  customer_phone text,
  party_size integer not null check (party_size >= 1),
  scheduled_at timestamp with time zone not null,
  booking_date date not null,
  duration_minutes integer not null default 120 check (duration_minutes > 0),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show', 'expired')
  ),
  pre_order_id uuid references public.pre_orders(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index table_bookings_booking_date_table_idx
  on public.table_bookings (booking_date, dining_table_id);

create index table_bookings_status_scheduled_idx
  on public.table_bookings (status, scheduled_at);

alter table public.table_bookings enable row level security;

create policy "Allow public read on table_bookings"
  on public.table_bookings for select
  using (true);

create policy "Allow anon insert on table_bookings"
  on public.table_bookings for insert
  to anon, authenticated
  with check (true);

create policy "Allow authenticated update on table_bookings"
  on public.table_bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on table_bookings"
  on public.table_bookings for delete
  to authenticated
  using (true);

create trigger set_table_bookings_updated_at
  before update on public.table_bookings
  for each row
  execute function public.handle_updated_at();
