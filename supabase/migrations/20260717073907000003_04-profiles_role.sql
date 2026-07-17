-- Role pengguna + helper RLS owner

alter table public.profiles
  add column if not exists role text not null default 'staff'
    check (role in ('owner', 'staff'));

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- Profil: owner boleh ubah role user lain (bukan diri sendiri lewat halaman users)
drop policy if exists "Allow users update own profile" on public.profiles;
create policy "Users update own profile fields"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "Owner updates user roles" on public.profiles;
create policy "Owner updates user roles"
  on public.profiles for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  if not exists (select 1 from public.profiles where role = 'owner') then
    assigned_role := 'owner';
  else
    assigned_role := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'staff');
    if assigned_role not in ('owner', 'staff') then
      assigned_role := 'staff';
    end if;
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    assigned_role
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

-- Set owner untuk user pertama yang sudah ada (jika belum ada owner)
update public.profiles
set role = 'owner'
where id = (
  select id from public.profiles order by created_at asc limit 1
)
and not exists (select 1 from public.profiles where role = 'owner');
