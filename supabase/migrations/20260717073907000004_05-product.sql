-- Create the products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  purchase_price numeric(10, 2) not null default 0 check (purchase_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text unique,
  image_url text,
  is_addons boolean not null default false,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.products enable row level security;

-- Create policies
create policy "Allow public read access"
  on public.products for select
  using (true);

create policy "Allow authenticated insert on products"
  on public.products for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on products"
  on public.products for delete
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

create trigger set_products_updated_at
  before update on public.products
  for each row
  execute function public.handle_updated_at();