-- Dining tables master: canonical table number, seats, and active flag

create table public.dining_tables (
  id uuid default gen_random_uuid() primary key,
  table_number text not null,
  seats integer not null check (seats >= 1),
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index dining_tables_table_number_idx
  on public.dining_tables (table_number);

alter table public.dining_tables enable row level security;

create policy "Allow public read on dining_tables"
  on public.dining_tables for select
  using (true);

create policy "Allow authenticated insert on dining_tables"
  on public.dining_tables for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on dining_tables"
  on public.dining_tables for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on dining_tables"
  on public.dining_tables for delete
  to authenticated
  using (true);

create trigger set_dining_tables_updated_at
  before update on public.dining_tables
  for each row
  execute function public.handle_updated_at();
