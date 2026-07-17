-- Queue numbers reset to 1 each calendar day (per queue_date).
-- Run after order_queues.ddl. Uses Asia/Jakarta so "today" matches the app.

alter table public.order_queues
  alter column queue_date set default (timezone('Asia/Jakarta', now()))::date;

create index if not exists order_queues_queue_date_number_idx
  on public.order_queues (queue_date, queue_number);
