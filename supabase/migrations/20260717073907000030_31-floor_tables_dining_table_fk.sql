-- Link floor plan tables to dining_tables master

alter table public.floor_tables
  add column if not exists dining_table_id uuid references public.dining_tables(id) on delete set null;

create unique index if not exists floor_tables_dining_table_id_idx
  on public.floor_tables (dining_table_id)
  where kind = 'table' and dining_table_id is not null;

-- Migrate existing floor_tables (kind = table) into dining_tables
insert into public.dining_tables (table_number, seats, is_active)
select distinct on (trim(ft.label))
  trim(ft.label) as table_number,
  greatest(coalesce(ft.seats, 4), 1) as seats,
  true as is_active
from public.floor_tables ft
where coalesce(ft.kind, 'table') = 'table'
  and trim(ft.label) <> ''
  and not exists (
    select 1
    from public.dining_tables dt
    where dt.table_number = trim(ft.label)
  )
order by trim(ft.label), ft.created_at;

update public.floor_tables ft
set dining_table_id = dt.id
from public.dining_tables dt
where coalesce(ft.kind, 'table') = 'table'
  and trim(ft.label) = dt.table_number
  and ft.dining_table_id is null;
