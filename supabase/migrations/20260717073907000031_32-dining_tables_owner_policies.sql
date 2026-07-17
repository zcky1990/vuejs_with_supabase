-- Dining tables master: owner-only writes

drop policy if exists "Allow authenticated insert on dining_tables" on public.dining_tables;
drop policy if exists "Allow authenticated update on dining_tables" on public.dining_tables;
drop policy if exists "Allow authenticated delete on dining_tables" on public.dining_tables;

create policy "Owner insert on dining_tables"
  on public.dining_tables for insert to authenticated
  with check (public.is_owner());

create policy "Owner update on dining_tables"
  on public.dining_tables for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner delete on dining_tables"
  on public.dining_tables for delete to authenticated
  using (public.is_owner());
