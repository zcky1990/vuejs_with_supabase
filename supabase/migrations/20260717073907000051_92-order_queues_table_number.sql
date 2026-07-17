-- Add optional table number to order queues

alter table public.order_queues
  add column if not exists table_number text;
