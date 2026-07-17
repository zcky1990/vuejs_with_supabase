-- Public pre-orders (submitted before staff processes into transactions)

create table public.pre_orders (
  id uuid default gen_random_uuid() primary key,
  order_number integer not null,
  order_date date not null default (timezone('utc'::text, now()))::date,
  customer_name text,
  table_number text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  payment_choice text not null check (payment_choice in ('pay_later', 'pay_now')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'awaiting_confirmation', 'confirmed')),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (order_date, order_number)
);

create index pre_orders_status_created_idx
  on public.pre_orders (status, created_at desc);

create table public.pre_order_items (
  id uuid default gen_random_uuid() primary key,
  pre_order_id uuid not null references public.pre_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index pre_order_items_pre_order_id_idx
  on public.pre_order_items (pre_order_id);

create table public.pre_order_item_addons (
  id uuid default gen_random_uuid() primary key,
  pre_order_item_id uuid not null references public.pre_order_items(id) on delete cascade,
  addon_product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index pre_order_item_addons_item_id_idx
  on public.pre_order_item_addons (pre_order_item_id);

alter table public.pre_orders enable row level security;
alter table public.pre_order_items enable row level security;
alter table public.pre_order_item_addons enable row level security;

create policy "Allow authenticated read on pre_orders"
  on public.pre_orders for select
  to authenticated
  using (true);

create policy "Allow anon insert on pre_orders"
  on public.pre_orders for insert
  to anon, authenticated
  with check (true);

create policy "Allow authenticated update on pre_orders"
  on public.pre_orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated read on pre_order_items"
  on public.pre_order_items for select
  to authenticated
  using (true);

create policy "Allow anon insert on pre_order_items"
  on public.pre_order_items for insert
  to anon, authenticated
  with check (true);

create policy "Allow authenticated read on pre_order_item_addons"
  on public.pre_order_item_addons for select
  to authenticated
  using (true);

create policy "Allow anon insert on pre_order_item_addons"
  on public.pre_order_item_addons for insert
  to anon, authenticated
  with check (true);

create trigger set_pre_orders_updated_at
  before update on public.pre_orders
  for each row
  execute function public.handle_updated_at();

-- Realtime for staff inbox (run after table exists)
alter publication supabase_realtime add table public.pre_orders;
