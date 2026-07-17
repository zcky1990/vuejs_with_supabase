-- Transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null references public.customers(id),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  is_paid boolean not null default false,
  payment_method text check (payment_method in ('qris', 'cash', 'transfer')),
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.transaction_items (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

create policy "Allow public read access on transactions"
  on public.transactions for select
  using (true);

create policy "Allow public read access on transaction_items"
  on public.transaction_items for select
  using (true);

create policy "Allow authenticated insert on transactions"
  on public.transactions for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on transactions"
  on public.transactions for update
  to authenticated
  using (true);

create policy "Allow authenticated delete on transactions"
  on public.transactions for delete
  to authenticated
  using (true);

create policy "Allow authenticated insert on transaction_items"
  on public.transaction_items for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on transaction_items"
  on public.transaction_items for update
  to authenticated
  using (true);

create policy "Allow authenticated delete on transaction_items"
  on public.transaction_items for delete
  to authenticated
  using (true);

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row
  execute function public.handle_updated_at();

-- Default walk-in customer for unknown buyers
insert into public.customers (name, notes, is_active)
select 'Walk-in Customer', 'Default customer for unknown buyers', true
where not exists (
  select 1 from public.customers where name = 'Walk-in Customer'
);
