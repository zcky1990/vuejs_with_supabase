-- Customer membership and loyalty point balance cache

alter table public.customers
  add column if not exists is_member boolean not null default false;

alter table public.customers
  add column if not exists loyalty_points integer not null default 0
    check (loyalty_points >= 0);

create index if not exists customers_is_member_idx
  on public.customers (is_member)
  where is_member = true;
