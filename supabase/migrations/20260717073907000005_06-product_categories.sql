-- Product categories for grouping menu/addon products

create table public.product_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.product_categories enable row level security;

create policy "Allow public read on product_categories"
  on public.product_categories for select
  using (true);

create policy "Allow authenticated insert on product_categories"
  on public.product_categories for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on product_categories"
  on public.product_categories for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on product_categories"
  on public.product_categories for delete
  to authenticated
  using (true);

create trigger set_product_categories_updated_at
  before update on public.product_categories
  for each row
  execute function public.handle_updated_at();

-- Link products to categories (nullable)
alter table public.products
  add column if not exists category_id uuid references public.product_categories(id) on delete set null;

create index if not exists products_category_id_idx
  on public.products (category_id);
