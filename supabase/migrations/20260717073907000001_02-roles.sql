-- Referensi role aplikasi (owner, staff)

create table if not exists public.roles (
  code text primary key check (code in ('owner', 'staff')),
  sort_order integer not null default 0
);

insert into public.roles (code, sort_order)
values
  ('owner', 1),
  ('staff', 2)
on conflict (code) do nothing;

alter table public.roles enable row level security;

create policy "Allow authenticated read on roles"
  on public.roles for select
  to authenticated
  using (true);
