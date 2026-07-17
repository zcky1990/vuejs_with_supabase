-- Aktifkan Supabase Realtime untuk tabel antrian (wajib untuk update live di /queue)

alter publication supabase_realtime add table public.order_queues;
