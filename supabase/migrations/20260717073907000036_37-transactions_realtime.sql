-- Realtime for transactions (floor plan occupied → free after payment)

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.transactions';
  end if;
exception
  when duplicate_object then null;
end $$;
