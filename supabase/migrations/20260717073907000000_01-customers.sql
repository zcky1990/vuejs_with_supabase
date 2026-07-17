-- Create the customers table
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique,
  phone text,
  address text,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.customers enable row level security;

-- Create policies
create policy "Allow public read access"
  on public.customers for select
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

-- Automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_customers_updated_at
  before update on public.customers
  for each row
  execute function public.handle_updated_at();
