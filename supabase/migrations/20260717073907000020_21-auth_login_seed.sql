-- Login: akun owner awal + sinkronisasi public.profiles
-- Jalankan SETELAH 03-profiles.ddl dan 04-profiles_role.ddl (disarankan: seluruh 01–20).
--
-- === CONFIG — ganti sebelum Run ===
-- Email & password dipakai untuk login di /login

create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.seed_login_owner(
  p_email text default 'owner@warung.local',
  p_password text default 'ChangeMe123!',
  p_full_name text default 'Owner'
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_email text := lower(trim(p_email));
  v_password text := p_password;
  v_full_name text := nullif(trim(p_full_name), '');
begin
  if v_email is null or v_email = '' then
    raise exception 'seed_login_owner: email wajib diisi';
  end if;

  if v_password is null or length(v_password) < 8 then
    raise exception 'seed_login_owner: password minimal 8 karakter';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', coalesce(v_full_name, 'Owner'), 'role', 'owner'),
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    );
  else
    update auth.users
    set
      email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('full_name', coalesce(v_full_name, raw_user_meta_data->>'full_name', 'Owner'), 'role', 'owner')
    where id = v_user_id;
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    v_user_id,
    coalesce(v_full_name, 'Owner'),
    v_email,
    'owner'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = 'owner',
    updated_at = timezone('utc', now());
end;
$$;

-- Sinkronkan semua auth.users → profiles (backfill / perbaikan data)
insert into public.profiles (id, full_name, email, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  u.email,
  case
    when not exists (select 1 from public.profiles p where p.role = 'owner') then 'owner'
    when coalesce(u.raw_user_meta_data->>'role', '') in ('owner', 'staff') then u.raw_user_meta_data->>'role'
    else 'staff'
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Pastikan user tanpa konfirmasi email bisa login (dev / akun seed)
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('email_verified', true)
where email_confirmed_at is null;

select public.seed_login_owner(
  'owner@warung.local',
  'ChangeMe123!',
  'Owner'
);

-- Hapus fungsi seed setelah dipakai (opsional — biarkan jika ingin panggil ulang)
-- drop function if exists public.seed_login_owner(text, text, text);
