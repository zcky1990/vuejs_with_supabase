-- Kitchen / order queue linked to transactions

create table public.order_queues (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  queue_number integer not null,
  queue_date date not null default (timezone('utc'::text, now()))::date,
  status text not null default 'waiting' check (status in ('waiting', 'preparing', 'ready', 'serving', 'completed', 'cancelled')),
  table_number text,
  picked_up_at timestamp with time zone,
  ready_at timestamp with time zone,
  serving_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (queue_date, queue_number)
);

create index order_queues_status_created_idx
  on public.order_queues (status, created_at desc);

alter table public.order_queues enable row level security;

create policy "Allow public read on order_queues"
  on public.order_queues for select
  using (true);

create policy "Allow authenticated insert on order_queues"
  on public.order_queues for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update on order_queues"
  on public.order_queues for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated delete on order_queues"
  on public.order_queues for delete
  to authenticated
  using (true);

create trigger set_order_queues_updated_at
  before update on public.order_queues
  for each row
  execute function public.handle_updated_at();
