-- Floor plan: support non-table elements (zones) with custom name and color

alter table public.floor_tables
  add column if not exists kind text not null default 'table'
    check (kind in ('table', 'zone'));

alter table public.floor_tables
  add column if not exists color text;
