-- Add serving status: order is being delivered to the customer

alter table public.order_queues
  drop constraint if exists order_queues_status_check;

alter table public.order_queues
  add constraint order_queues_status_check
  check (status in ('waiting', 'preparing', 'ready', 'serving', 'completed', 'cancelled'));

alter table public.order_queues
  add column if not exists serving_at timestamp with time zone;
