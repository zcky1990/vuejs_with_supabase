-- Shop configuration: QRIS image URL and transfer bank details

create table public.shop_config (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  qris_image_url text,
  transfer_bank_name text,
  transfer_account_number text,
  transfer_account_holder text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.shop_config (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

alter table public.shop_config enable row level security;

create policy "Allow public read on shop_config"
  on public.shop_config for select
  using (true);

create policy "Allow authenticated update on shop_config"
  on public.shop_config for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated insert on shop_config"
  on public.shop_config for insert
  to authenticated
  with check (true);

create trigger set_shop_config_updated_at
  before update on public.shop_config
  for each row
  execute function public.handle_updated_at();

-- Storage bucket for QRIS image
insert into storage.buckets (id, name, public)
values ('shop-assets', 'shop-assets', true)
on conflict (id) do nothing;

create policy "Public read shop assets"
  on storage.objects for select
  using (bucket_id = 'shop-assets');

create policy "Authenticated upload shop assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shop-assets');

create policy "Authenticated update shop assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shop-assets');

create policy "Authenticated delete shop assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shop-assets');
