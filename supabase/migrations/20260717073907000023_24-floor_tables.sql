-- Floor plan tables: visual table arrangement with numbers and positions

create table public.floor_tables (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  shape text not null default 'square' check (shape in ('round', 'square')),
  pos_x integer not null default 0,
  pos_y integer not null default 0,
  width integer not null default 80,
  height integer not null default 80,
  seats integer,
  area text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index floor_tables_sort_order_idx
  on public.floor_tables (sort_order, created_at);

alter table public.floor_tables enable row level security;

create policy "Allow public read on floor_tables"
  on public.floor_tables for select
  using (true);

create policy "Allow authenticated insert on floor_tables"
  on public.floor_tables for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on floor_tables"
  on public.floor_tables for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on floor_tables"
  on public.floor_tables for delete
  to authenticated
  using (true);

create trigger set_floor_tables_updated_at
  before update on public.floor_tables
  for each row
  execute function public.handle_updated_at();
