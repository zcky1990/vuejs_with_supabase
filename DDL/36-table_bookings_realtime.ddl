-- Realtime for table bookings (floor plan + staff list)

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.table_bookings';
  end if;
exception
  when duplicate_object then null;
end $$;
