# Vue Supabase Project — Sistem Kasir & Manajemen Warung

Aplikasi web untuk mengelola produk, pelanggan, transaksi penjualan, antrian pesanan, restock stok (dengan HPP FIFO), dan analisis keuntungan. Frontend dibangun dengan **Vue 3 + Vite + TypeScript**, backend/database menggunakan **Supabase** (PostgreSQL + Auth + Storage).

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Arsitektur Singkat](#arsitektur-singkat)
3. [Prasyarat](#prasyarat)
4. [Setup Supabase (Proyek Baru)](#setup-supabase-proyek-baru)
5. [Konfigurasi Autentikasi di Supabase](#konfigurasi-autentikasi-di-supabase)
6. [Setup Profiles untuk Auth](#setup-profiles-untuk-auth)
7. [Menjalankan DDL Database](#menjalankan-ddl-database)
8. [Konfigurasi Aplikasi Lokal](#konfigurasi-aplikasi-lokal)
9. [Menjalankan Aplikasi](#menjalankan-aplikasi)
10. [Struktur Folder Penting](#struktur-folder-penting)
11. [Rute Aplikasi](#rute-aplikasi)
12. [Konsep Bisnis: Stok & HPP](#konsep-bisnis-stok--hpp)
13. [Diagram Aktivitas (Mermaid)](#diagram-aktivitas-mermaid)
    - [Alur Pesanan Online (Sequence)](#8-alur-pesanan-online--pre-order-ke-antrian-dapur-sequence)
    - [Makan Dulu, Bayar Nanti (Dine-in)](#9-makan-dulu-bayar-nanti-dine-in)
      - [Kasir — Bayar Dulu](#91-kasir--bayar-dulu)
      - [Kasir — Makan Dulu, Bayar Nanti](#92-kasir--makan-dulu-bayar-nanti)
      - [QR Pre-order — Bayar Sekarang (pay_now)](#93-qr-pre-order--bayar-sekarang-pay_now)
      - [QR Pre-order — Makan Dulu (pay_later)](#94-qr-pre-order--makan-dulu-pay_later)
14. [Membership & Poin Loyalitas](#membership--poin-loyalitas)
15. [Troubleshooting](#troubleshooting)

---

## Fitur Utama

| Modul | Keterangan |
|-------|------------|
| **Halaman publik (`/`)** | Pencarian pelanggan/produk, lihat hutang, instruksi pembayaran QRIS/transfer |
| **Pesan online (`/order`)** | Pelanggan pilih menu, kirim pre-order (bayar nanti / bayar sekarang) tanpa login |
| **Reservasi meja (`/book`)** | Pelanggan pilih tanggal/jam, meja, dan pre-order menu (reservasi terjadwal) |
| **Sukses reservasi (`/book/success`)** | Konfirmasi meja, jadwal, dan ringkasan pre-order |
| **Sukses pesanan (`/order/success`)** | Konfirmasi nomor pesanan + instruksi bayar di kasir setelah pre-order |
| **Pesanan masuk (`/orders/inbox`)** | Staff memproses pre-order menjadi transaksi + antrian opsional |
| **Reservasi (`/bookings`)** | Staff kelola booking: konfirmasi, check-in, batalkan |
| **Master Produk** | CRUD produk, harga jual, harga beli default, stok awal, kategori |
| **Master Kategori** | CRUD kategori produk |
| **Master Pembeli** | CRUD pelanggan, status member, saldo & riwayat poin loyalitas |
| **Transaksi** | Buat penjualan, bayar / makan dulu (hutang), antrian opsional |
| **Meja Terbuka (`/transactions/open`)** | Daftar bon dine-in belum lunas — tagih setelah pelanggan selesai makan |
| **Daftar Transaksi** | Filter lunas/hutang, edit qty item |
| **Antrian** | Status: menunggu → disiapkan → siap → diantar → selesai |
| **Layar antrian (`/queue/display`)** | Tampilan fullscreen untuk TV dapur (publik, tanpa login) |
| **Restock** | Tambah stok per batch dengan harga beli & riwayat |
| **Analisis** | Pendapatan, HPP FIFO, laba kotor, chart, ranking produk |
| **Shift kasir (`/shifts`)** | Buka/tutup shift, saldo awal, penjualan per shift, selisih kas |
| **Konfigurasi** | Upload QRIS, data rekening transfer, info struk toko, mode pembayaran dine-in, kategori menu order, reservasi meja, program loyalitas |
| **Profil (`/profile`)** | Ubah nama, password, foto profil (WEBP), bahasa & tema |
| **Pengguna & Role (`/master/users`)** | Owner kelola akun dan role (owner/staff) |

---

## Arsitektur Singkat

```mermaid
flowchart TB
  subgraph client [Vue Frontend]
    Pages[Pages / Components]
    Lib[src/lib/*]
    Pages --> Lib
  end

  subgraph supabase [Supabase]
    Auth[Auth - Email Password]
    Profiles[(profiles)]
  PG[(PostgreSQL)]
    Storage[Storage - shop-assets]
  end

  Lib --> Auth
  Auth --> Profiles
  Lib --> PG
  Lib --> Storage
```

- **Autentikasi**: Supabase Auth (email + password). Token disimpan di cookie browser, divalidasi di `router.beforeEach`.
- **Data**: Semua operasi CRUD via Supabase JS client dengan Row Level Security (RLS).
- **Stok**: Perubahan stok **hanya** lewat `src/lib/stock.ts` → mencatat `stock_movements` + update `products.stock_quantity`.

---

## Prasyarat

- [Node.js](https://nodejs.org/) `^20.19` atau `>=22.12`
- [pnpm](https://pnpm.io/) (disarankan) atau npm
- Akun [Supabase](https://supabase.com/) (gratis cukup untuk development)
- Git (opsional)

---

## Setup Supabase (Proyek Baru)

### 1. Buat proyek

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Klik **New project**.
3. Isi nama proyek, password database, dan region (pilih yang terdekat, mis. Singapore).
4. Tunggu hingga proyek selesai diprovisioning.

### 2. Ambil kredensial API

1. Buka proyek → **Project Settings** (ikon gear) → **API**.
2. Catat:
   - **Project URL** → dipakai sebagai `VITE_SUPERBASE_URL`
   - **anon public** key → dipakai sebagai `VITE_SUPERBASE_PUBLISH_KEY`

> **Penting:** Jangan pernah commit file `.env` ke Git. Gunakan `.env.example` sebagai template.

### 3. Aktifkan Email Auth

1. Buka **Authentication** → **Providers**.
2. Pastikan **Email** dalam keadaan **Enabled**.
3. Untuk development, disarankan menonaktifkan konfirmasi email agar bisa langsung login setelah sign-up:
   - **Authentication** → **Providers** → **Email** → matikan **Confirm email**
   - Atau: **Authentication** → **Settings** → **Enable email confirmations** → OFF

---

## Konfigurasi Autentikasi di Supabase

Aplikasi memakai alur berikut:

1. User **Sign Up** (`/sign-up`) → `supabase.auth.signUp()`
2. User **Login** (`/login`) → `supabase.auth.signInWithPassword()`
3. Session disimpan ke cookie: `_access_token`, `_refresh_token`, `_user_email`, dll. (`src/lib/cookies.ts`)
4. Setiap navigasi ke route terproteksi → `validateOrRefreshSession()` di `src/lib/auth.ts`:
   - Coba `setSession` dari cookie
   - Jika gagal → `refreshSession`
   - Jika refresh gagal → logout & redirect ke `/login`
5. Route publik: `/` (halaman pelanggan), `/login`
6. Route terproteksi: semua path lain (dashboard, transaksi, master data, dll.)

### Buat akun login pertama

Jalankan [`21-auth_login_seed.ddl`](DDL/21-auth_login_seed.ddl) di SQL Editor **setelah** `04-profiles_role.ddl`.

1. Buka file tersebut, **ganti** email/password di bagian `select public.seed_login_owner(...)` (default: `owner@warung.local` / `ChangeMe123!`).
2. Run script → akun owner siap dipakai di `/login`.

Script ini juga:
- Membuat baris `auth.users` + `auth.identities` (bisa login langsung)
- Menyinkronkan `public.profiles` untuk semua user auth
- Mengatur role **owner** pada akun seed
- Mengisi `email_confirmed_at` agar tidak terblokir "Email not confirmed"

**Alternatif:** daftar lewat `/sign-up` (user pertama otomatis jadi owner lewat trigger di `04-profiles_role.ddl`).

### Redirect URL (opsional, untuk production)

Di **Authentication** → **URL Configuration**:

- **Site URL**: URL production Anda (mis. `https://warung-anda.com`)
- **Redirect URLs**: tambahkan `http://localhost:5173/**` untuk development

---

## Setup Profiles untuk Auth

Supabase Auth menyimpan akun login di schema `auth.users`. Tabel **`public.profiles`** melengkapi data yang bisa ditampilkan di aplikasi (nama, email) dan terhubung 1:1 dengan user auth.

```mermaid
flowchart LR
  signUp[signUp di aplikasi] --> authUsers[(auth.users)]
  authUsers -->|trigger on_auth_user_created| profiles[(public.profiles)]
  profiles --> appData[Data tampilan / audit user]
```

### Mengapa perlu profiles?

| Tanpa `profiles` | Dengan `profiles` |
|------------------|-------------------|
| Nama hanya di cookie `_user_email` | Nama lengkap tersimpan di database |
| Data user tersebar di metadata auth | Satu tabel mudah di-query dari aplikasi |
| User lama tidak punya record terstruktur | Backfill otomatis untuk user yang sudah ada |

### Setup otomatis (DDL)

| Kebutuhan | File |
|-----------|------|
| Tabel `profiles` + trigger signup | [`03-profiles.ddl`](DDL/03-profiles.ddl) |
| Role owner/staff + trigger diperbarui | [`04-profiles_role.ddl`](DDL/04-profiles_role.ddl) |
| Akun login owner + backfill profiles | [`21-auth_login_seed.ddl`](DDL/21-auth_login_seed.ddl) |

Tidak perlu menyalin SQL manual dari README — cukup jalankan file di atas berurutan.

### Verifikasi profiles

Setelah `21-auth_login_seed.ddl`, cek di SQL Editor:

```sql
select
  u.id,
  u.email as auth_email,
  p.full_name,
  p.email as profile_email,
  p.created_at
from auth.users u
left join public.profiles p on p.id = u.id
order by p.created_at desc nulls last;
```

Setiap baris di `auth.users` seharusnya punya pasangan di `profiles`.

### Metadata nama saat sign-up

Aplikasi mengirim `full_name` lewat `user_metadata` saat `signUp()` — trigger `handle_new_user` (di `03` / `04`) menyalinnya ke `profiles.full_name`.

### Diagram: pembuatan profile otomatis

```mermaid
flowchart TD
  start([User submit /sign-up]) --> signUpCall[auth.signUp + metadata full_name]
  signUpCall --> insertAuth[Insert ke auth.users]
  insertAuth --> trigger[Trigger on_auth_user_created]
  trigger --> handleNew[handle_new_user]
  handleNew --> insertProfile[Insert ke public.profiles]
  insertProfile --> done([Profile siap dipakai])
```

---

## Menjalankan DDL Database

Semua skema SQL ada di folder [`DDL/`](DDL/). Nama file diawali angka urutan (`01-`, `02-`, …) — **jalankan berurutan** di **Supabase SQL Editor**.

> **Instalasi baru:** jalankan **01–21**. File **90–94** hanya untuk database lama (boleh dilewati).

### 01–04 · Fondasi & auth

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`01-customers.ddl`](DDL/01-customers.ddl) | Tabel `customers` + RLS + `handle_updated_at()` | — |
| [`02-roles.ddl`](DDL/02-roles.ddl) | Tabel referensi role (`owner`, `staff`) | — |
| [`03-profiles.ddl`](DDL/03-profiles.ddl) | Tabel `profiles` + trigger dari `auth.users` | — |
| [`04-profiles_role.ddl`](DDL/04-profiles_role.ddl) | Kolom `profiles.role`, `is_owner()`, trigger signup | — |

### 05–09 · Master data & transaksi

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`05-product.ddl`](DDL/05-product.ddl) | Tabel `products` + RLS | — |
| [`06-product_categories.ddl`](DDL/06-product_categories.ddl) | Kategori + `category_id` di produk | — |
| [`07-transactions.ddl`](DDL/07-transactions.ddl) | `transactions`, `transaction_items`, walk-in | — |
| [`08-transaction_payment_method.ddl`](DDL/08-transaction_payment_method.ddl) | Kolom `payment_method`, `paid_at` | Sudah ada di `07-transactions.ddl` |
| [`09-product_addons.ddl`](DDL/09-product_addons.ddl) | Addon produk + `transaction_item_addons` | — |

### 10–11 · Konfigurasi toko

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`10-shop_config.ddl`](DDL/10-shop_config.ddl) | `shop_config` + bucket `shop-assets` | — |
| [`11-shop_config_invoice.ddl`](DDL/11-shop_config_invoice.ddl) | `shop_name`, `shop_address` untuk struk | Sudah ada di `10-shop_config.ddl` |

### 12–16 · Operasional (antrian & pre-order)

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`12-order_queues.ddl`](DDL/12-order_queues.ddl) | Antrian dapur | — |
| [`13-order_queues_realtime.ddl`](DDL/13-order_queues_realtime.ddl) | Realtime antrian | — |
| [`14-order_queues_daily_reset.ddl`](DDL/14-order_queues_daily_reset.ddl) | Reset nomor antrian harian | — |
| [`15-pre_orders.ddl`](DDL/15-pre_orders.ddl) | Pre-order publik + realtime | — |
| [`16-pre_orders_confirmed_payment.ddl`](DDL/16-pre_orders_confirmed_payment.ddl) | Konfirmasi bayar `pay_now` | — |

### 17–19 · Stok & shift kasir

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`17-stock_movements.ddl`](DDL/17-stock_movements.ddl) | Audit stok / HPP | — |
| [`18-stock_lot_allocations.ddl`](DDL/18-stock_lot_allocations.ddl) | Alokasi FIFO | — |
| [`19-cashier_shifts.ddl`](DDL/19-cashier_shifts.ddl) | Shift kasir + `transactions.shift_id` | — |

### 20–21 · Keamanan & login

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`20-role_owner_policies.ddl`](DDL/20-role_owner_policies.ddl) | RLS tulis master data & restock (owner) | — |
| [`21-auth_login_seed.ddl`](DDL/21-auth_login_seed.ddl) | Akun owner awal + sinkronisasi profiles | — |

### 22–28 · Fitur lanjutan (instalasi baru)

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`22-transaction_cancellation.ddl`](DDL/22-transaction_cancellation.ddl) | Pembatalan transaksi + audit trail | — |
| [`23-stock_opname.ddl`](DDL/23-stock_opname.ddl) | Stok opname / penyesuaian inventori | — |
| [`24-floor_tables.ddl`](DDL/24-floor_tables.ddl) | Denah meja (floor plan) | — |
| [`25-floor_tables_zones.ddl`](DDL/25-floor_tables_zones.ddl) | Zona non-meja di denah | — |
| [`26-order_queues_serving.ddl`](DDL/26-order_queues_serving.ddl) | Status antrian `serving` (mengantar ke meja) | — |
| [`27-transactions_table_number.ddl`](DDL/27-transactions_table_number.ddl) | Kolom `table_number` di transaksi + index bon terbuka | — |
| [`28-shop_config_payment_flow.ddl`](DDL/28-shop_config_payment_flow.ddl) | Mode pembayaran dine-in (`payment_flow_mode`) | — |
| [`29-shop_config_menu_categories.ddl`](DDL/29-shop_config_menu_categories.ddl) | Kategori menu yang tampil di `/order` dan kasir (`menu_category_ids`) | — |
| [`30-dining_tables.ddl`](DDL/30-dining_tables.ddl) | Master meja (`table_number`, `seats`, `is_active`) | — |
| [`31-floor_tables_dining_table_fk.ddl`](DDL/31-floor_tables_dining_table_fk.ddl) | FK `dining_table_id` di denah + migrasi label meja lama | Butuh `30` |
| [`32-dining_tables_owner_policies.ddl`](DDL/32-dining_tables_owner_policies.ddl) | RLS owner-only untuk master meja | Butuh `30` + `20` |
| [`33-table_bookings.ddl`](DDL/33-table_bookings.ddl) | Reservasi meja terjadwal (`table_bookings`) | Butuh `30` |
| [`34-pre_orders_booking_id.ddl`](DDL/34-pre_orders_booking_id.ddl) | Kolom `booking_id` di `pre_orders` | Butuh `33` + `15` |
| [`35-shop_config_booking.ddl`](DDL/35-shop_config_booking.ddl) | Pengaturan reservasi di `shop_config` | Butuh `10` |
| [`36-table_bookings_realtime.ddl`](DDL/36-table_bookings_realtime.ddl) | Realtime publication untuk `table_bookings` | Butuh `33` |
| [`37-transactions_realtime.ddl`](DDL/37-transactions_realtime.ddl) | Realtime publication untuk `transactions` (denah meja) | — |
| [`38-pre_order_items_staff_policies.ddl`](DDL/38-pre_order_items_staff_policies.ddl) | Staff dapat ubah item pre-order di inbox | Butuh `15` |
| [`39-customers_membership.ddl`](DDL/39-customers_membership.ddl) | Kolom `is_member`, `loyalty_points` di `customers` | — |
| [`40-shop_config_loyalty.ddl`](DDL/40-shop_config_loyalty.ddl) | Pengaturan program loyalitas di `shop_config` | Butuh `10` |
| [`41-customer_loyalty_ledger.ddl`](DDL/41-customer_loyalty_ledger.ddl) | Riwayat perubahan poin (`customer_point_ledger`) | Butuh `39` |
| [`42-transactions_loyalty.ddl`](DDL/42-transactions_loyalty.ddl) | Kolom diskon & poin di `transactions` (`gross_amount`, dll.) | — |
| [`43-shop_config_loyalty_minimum.ddl`](DDL/43-shop_config_loyalty_minimum.ddl) | Minimal nominal transaksi untuk dapat poin | Butuh `10` |

### 90–94 · Migrasi database lama (opsional)

| File | Keterangan | Lewati jika… |
|------|------------|--------------|
| [`90-product_purchase_price.ddl`](DDL/90-product_purchase_price.ddl) | Tambah `purchase_price` | `05-product.ddl` sudah dipakai |
| [`91-stock_movements_costing.ddl`](DDL/91-stock_movements_costing.ddl) | Kolom costing stok | `17-stock_movements.ddl` sudah lengkap |
| [`92-order_queues_table_number.ddl`](DDL/92-order_queues_table_number.ddl) | Tambah `table_number` antrian | `12-order_queues.ddl` sudah dipakai |
| [`93-product_is_addons.ddl`](DDL/93-product_is_addons.ddl) | Migrasi `product_type` → `is_addons` | DB tidak pakai `product_type` |
| [`94-masterdata_policies.ddl`](DDL/94-masterdata_policies.ddl) | Perbaiki RLS master data (403) | `20-role_owner_policies.ddl` sudah cukup |

### Cara menjalankan di SQL Editor

1. Buka file `.ddl` berikutnya (urutkan berdasarkan prefix angka di folder `DDL/`).
2. Salin seluruh isinya.
3. Di Supabase → **SQL** → **New query** → paste → **Run**.
4. Pastikan muncul pesan sukses sebelum lanjut ke file berikutnya.

### Verifikasi cepat

Jalankan query ini setelah semua DDL:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'customers', 'profiles', 'products', 'transactions', 'transaction_items',
    'shop_config', 'order_queues', 'pre_orders', 'pre_order_items', 'pre_order_item_addons',
    'stock_movements', 'stock_lot_allocations', 'customer_point_ledger'
  )
order by table_name;
```

Harus mengembalikan **13** baris (termasuk `customer_point_ledger` setelah DDL 39–41).

### Cara menjalankan dengan Supabase CLI (disarankan)

> **Butuh Supabase CLI** — sudah terinstall sebagai dev dependency (`pnpm add -D supabase`).

```bash
# 1. Login ke Supabase
npx supabase login

# 2. Link project (dapatkan project ref dari Dashboard → Settings → General)
npx supabase link --project-ref <PROJECT_REF>

# 3. Push semua migration ke database
pnpm migrate:push
```

Semua file SQL dari `supabase/migrations/` akan dijalankan berurutan. Supabase otomatis skip yang sudah pernah di-applied.

#### Perintah migration

| Perintah | Fungsi |
|----------|--------|
| `pnpm migrate:new <nama>` | Buat file migration baru |
| `pnpm migrate:push` | Push migration ke database |
| `pnpm migrate:pull` | Backup schema dari remote |
| `pnpm migrate:list` | Lihat daftar migration lokal |
| `pnpm migrate:status` | Cek status migration di remote |
| `pnpm migrate:repair <versi>` | Tandai migration sebagai applied (perbaikan) |
| `pnpm migrate:ddl` | Konversi `DDL/*.ddl` → `supabase/migrations/` |

#### Alternatif: SQL Editor (manual)

1. Buka file `.ddl` di folder `DDL/` berurutan.
2. Di Supabase → **SQL** → **New query** → paste → **Run**.
3. Ulangi untuk setiap file.

---

## Konfigurasi Aplikasi Lokal

### 1. Clone & install dependency

```sh
cd vue-superbase-project
pnpm install
```

### 2. Buat file `.env`

Salin dari `.env.example`:

```sh
cp .env.example .env
```

Isi nilai:

```env
VITE_SUPERBASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPERBASE_PUBLISH_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opsional: nomor WA untuk kirim bukti bayar dari halaman publik (format: 6281234567890)
VITE_PAYMENT_PROOF_WHATSAPP=6281234567890

# Opsional: history (default) atau hash — hash untuk deploy tanpa server rewrite
# VITE_ROUTER_MODE=hash
```

---

## Menjalankan Aplikasi

```sh
# Development (hot reload)
pnpm dev

# Build production
pnpm build

# Preview build
pnpm preview

# Lint
pnpm lint
```

Buka browser: `http://localhost:5173`

| URL | Akses |
|-----|-------|
| `/`, `/order`, `/order/success`, `/book`, `/book/success`, `/queue/display` | Publik — tanpa login |
| `/login`, `/sign-up` | Guest |
| `/dashboard`, `/profile`, `/transactions`, `/master/products`, dll. | Harus login |

---

## Struktur Folder Penting

```
vue-superbase-project/
├── DDL/                    # Skrip SQL Supabase (01–42 instalasi baru, 90–94 migrasi)
├── src/
│   ├── pages/              # Halaman per route
│   ├── components/         # UI & form
│   ├── lib/
│   │   ├── supabase.ts     # Klien Supabase
│   │   ├── auth.ts         # Login, session, refresh
│   │   ├── product.ts      # Master produk
│   │   ├── customer.ts     # Master pelanggan
│   │   ├── transaction.ts  # Penjualan & hutang
│   │   ├── loyalty.ts      # Membership & poin loyalitas
│   │   ├── stock.ts        # Restock, FIFO, pergerakan stok
│   │   ├── queue.ts        # Antrian
│   │   ├── analytics.ts    # Laporan laba
│   │   └── config.ts       # QRIS, rekening, loyalitas, reservasi
│   ├── types/database.ts   # TypeScript types
│   └── router/index.ts     # Route guard auth
├── .env.example
└── package.json
```

---

## Rute Aplikasi

| Path | Halaman | Grup sidebar |
|------|---------|--------------|
| `/` | Pencarian publik | — |
| `/order` | Pesan menu (publik) | — |
| `/order/success` | Konfirmasi pesanan + nomor antrian kasir (publik) | — |
| `/book` | Reservasi meja + pre-order menu (publik) | — |
| `/book/success` | Konfirmasi reservasi (publik) | — |
| `/queue/display` | Layar antrian TV dapur (publik) | — |
| `/login` | Login | — |
| `/sign-up` | Daftar akun | — |
| `/dashboard` | Dashboard ringkasan | Beranda |
| `/profile` | Profil akun (nama, password, foto) | Akun (menu user) |
| `/orders/inbox` | Pesanan masuk dari publik | Operasional |
| `/bookings` | Reservasi meja — konfirmasi & check-in | Operasional |
| `/transactions` | Buat transaksi | Operasional |
| `/transactions/open` | Meja terbuka — tagih bon dine-in | Operasional |
| `/transactions/list` | Daftar transaksi | Operasional |
| `/queue` | Kelola antrian dapur | Operasional |
| `/stock/restock` | Restock | Operasional |
| `/analytics` | Analisis keuntungan | Laporan |
| `/shifts` | Shift kasir (buka/tutup, ringkasan harian) | Laporan |
| `/master/products` | Master produk | Master Data |
| `/master/categories` | Master kategori | Master Data |
| `/master/tables` | Master meja (nomor, kursi, ketersediaan) | Master Data |
| `/master/customers` | Master pembeli | Master Data |
| `/master/users` | Pengguna & role (owner only) | Master Data |
| `/config` | Konfigurasi toko | Pengaturan |

---

## Konsep Bisnis: Stok & HPP

| Istilah | Arti di aplikasi ini |
|---------|----------------------|
| **Harga jual** | `products.price` — harga ke pelanggan |
| **Harga beli (default)** | `products.purchase_price` — pre-fill saat restock |
| **Harga beli per batch** | `stock_movements.unit_cost` — terkunci saat restock |
| **HPP** | Harga Pokok Penjualan = biaya stok yang terpakai saat dijual (FIFO) |
| **Laba kotor** | Pendapatan − HPP |

Alur stok:

- **Restock** → tambah stok + catat batch dengan `unit_cost`
- **Penjualan** → kurangi stok FIFO + catat `sale` movement dengan `total_cost` (HPP)
- **Edit transaksi** → penyesuaian stok via `adjustment` / `sale` delta

---

## Diagram Aktivitas (Mermaid)

Sub-bagian penting:
- **§5** — Antrian dapur (status `waiting` → `preparing` → `ready` → `serving` → `completed`)
- **§8** — [Alur pesanan online lengkap](#8-alur-pesanan-online--pre-order-ke-antrian-dapur-sequence) (pre-order → bayar → antrian → selesai)

### 1. Autentikasi (Login & Session Guard)

```mermaid
flowchart TD
  start([User membuka aplikasi]) --> checkRoute{Route?}
  checkRoute -->|"/"| publicHome[Tampilkan halaman publik]
  checkRoute -->|"/login"| guestLogin[Tampilkan form login]
  checkRoute -->|Route terproteksi| hasCookie{Ada token di cookie?}

  hasCookie -->|Tidak| redirectLogin[Redirect ke /login]
  hasCookie -->|Ya| setSession[setSession dari cookie]
  setSession --> sessionOk{Session valid?}
  sessionOk -->|Ya| getUser[getUser]
  getUser --> userOk{User valid?}
  userOk -->|Ya| allowAccess[Akses halaman]
  userOk -->|Tidak| refreshToken[refreshSession]
  sessionOk -->|Tidak| refreshToken
  refreshToken --> refreshOk{Refresh berhasil?}
  refreshOk -->|Ya| persistCookie[Simpan token baru ke cookie]
  persistCookie --> allowAccess
  refreshOk -->|Tidak| logout[signOut + hapus cookie]
  logout --> redirectLogin

  guestLogin --> submitLogin[User submit email/password]
  submitLogin --> signIn[signInWithPassword]
  signIn --> loginOk{Berhasil?}
  loginOk -->|Tidak| showError[Tampilkan error]
  loginOk -->|Ya| persistCookie
  persistCookie --> goDashboard[Redirect /dashboard atau route tujuan]
```

### 2. Registrasi Akun Baru

```mermaid
flowchart TD
  start([User buka /sign-up]) --> fillForm[Isi nama email password]
  fillForm --> validate[Validasi Zod schema]
  validate --> validOk{Valid?}
  validOk -->|Tidak| showFieldError[Tampilkan error field]
  validOk -->|Ya| signUp[supabase.auth.signUp]
  signUp --> signUpOk{Berhasil?}
  signUpOk -->|Tidak| showAuthError[Tampilkan error Supabase]
  signUpOk -->|Ya| alertSuccess[Akun berhasil dibuat]
  alertSuccess --> goLogin[Redirect ke /login]
  goLogin --> noteEmail{Konfirmasi email aktif?}
  noteEmail -->|Ya| mustConfirm[User harus klik link di email dulu]
  noteEmail -->|Tidak| canLogin[User bisa langsung login]
```

### 3. Buat Transaksi & Pengaruh Stok

```mermaid
flowchart TD
  start([Kasir buka Buat Transaksi]) --> pickCustomer[Pilih pelanggan]
  pickCustomer --> addItems[Tambah produk + qty]
  addItems --> chooseAction{Tombol aksi?}

  chooseAction -->|Simpan Hutang| createDebt[createTransaction tanpa payment]
  chooseAction -->|Bayar| pickPayment[Pilih metode: QRIS/Cash/Transfer]
  chooseAction -->|+ Antrian| createWithQueue[createTransaction + createQueue]

  pickPayment --> createPaid[createTransaction dengan paymentMethod]
  createPaid --> maybeQueue{Antrian?}
  maybeQueue -->|Ya| createWithQueue
  maybeQueue -->|Tidak| afterCreate
  createDebt --> afterCreate
  createWithQueue --> afterCreate

  afterCreate[Insert transactions + transaction_items] --> recordStock[recordSaleStock per item]
  recordStock --> fifo[consumeFifoLots dari batch restock]
  fifo --> saleMovement[Insert stock_movements type sale + total_cost HPP]
  saleMovement --> done([Transaksi selesai stok berkurang])
```

### 4. Restock Produk

```mermaid
flowchart TD
  start([Admin buka menu Restock]) --> pickProduct[Pilih produk]
  pickProduct --> openDialog[Dialog: qty + harga beli + catatan]
  openDialog --> submit[restockProduct]
  submit --> validate[Validasi restockSchema]
  validate --> validOk{Valid?}
  validOk -->|Tidak| showError[Tampilkan error]
  validOk -->|Ya| insertMovement[Insert stock_movements type restock]
  insertMovement --> setBatch[Simpan unit_cost total_cost remaining_quantity]
  setBatch --> updateStock[Update products.stock_quantity]
  updateStock --> refreshUI[Refresh daftar + riwayat restock]
```

### 5. Antrian Pesanan (Dapur)

```mermaid
flowchart TD
  start([Transaksi dengan opsi antrian]) --> createQueue[Insert order_queues status waiting]
  createQueue --> kitchen[Buka halaman Antrian]
  kitchen --> action{Status saat ini?}
  action -->|waiting| pickup[pickupQueue → preparing]
  action -->|preparing| ready[markQueueReady → ready]
  action -->|ready| serving[markQueueServing → serving]
  action -->|serving| complete[completeQueue → completed]
  pickup --> kitchen
  ready --> kitchen
  serving --> kitchen
  complete --> endState([Antrian selesai])
```

### 6. Halaman Publik — Cek Hutang Pelanggan

```mermaid
flowchart TD
  start([Pelanggan buka "/"]) --> search[Ketik nama pelanggan]
  search --> query[getCustomers + getCustomersWithDebt]
  query --> showList[Tampilkan kartu pelanggan + nominal hutang]
  showList --> clickCard{Klik pelanggan?}
  clickCard -->|Ya| unpaidDialog[Dialog item belum lunas]
  unpaidDialog --> payCTA{Mau bayar?}
  payCTA -->|Ya| paymentDialog[Instruksi QRIS / Transfer dari shop_config]
  paymentDialog --> waOpsional[Kirim bukti via WhatsApp jika dikonfigurasi]
  clickCard -->|Tidak| search
```

### 7. Analisis Keuntungan

```mermaid
flowchart TD
  start([Admin buka /analytics]) --> pickPeriod[Pilih periode: hari ini / 7 hari / bulan / custom]
  pickPeriod --> fetch[Query transaksi + stock_movements dalam range]
  fetch --> calcRevenue[Hitung pendapatan dari transaction_items.subtotal]
  calcRevenue --> calcHPP[Hitung HPP dari sale movements total_cost]
  calcHPP --> calcProfit[Laba kotor = Pendapatan - HPP]
  calcProfit --> render[Tampilkan KPI cards + chart + tabel produk]
```

### 8. Alur Pesanan Online — Pre-order ke Antrian Dapur (Sequence)

Diagram ini menggambarkan alur pesanan dari halaman publik `/order` hingga selesai di dapur. Aplikasi memanggil Supabase langsung (tanpa backend API terpisah); pembaruan antrian disiarkan lewat **Supabase Realtime**.

**Ringkasan status antrian:**

```mermaid
stateDiagram-v2
    direction LR
    [*] --> waiting: processPreOrder
    waiting --> preparing: pickupQueue
    preparing --> ready: markQueueReady
    ready --> serving: markQueueServing
    serving --> completed: completeQueue
    completed --> [*]
```

| Status | Arti | Tombol di `/queue` |
|--------|------|-------------------|
| `waiting` | Menunggu diproses dapur | Pickup |
| `preparing` | Sedang dimasak / disiapkan | Siap |
| `ready` | Siap diantar ke pelanggan | Antar |
| `serving` | Sedang diantarkan ke meja | Selesai |
| `completed` | Pelanggan sudah menerima | — |

**Sequence diagram lengkap:**

```mermaid
sequenceDiagram
    autonumber

    actor Pelanggan
    actor Kasir
    actor Staff as Staff Dapur

    participant App as Vue App
    participant SB as Supabase

    Pelanggan->>App: Pilih menu dan kirim pre-order
    App->>SB: createPreOrder
    activate SB
    SB->>SB: Simpan pre_orders status pending
    SB-->>App: Pre-order dibuat
    deactivate SB
    App-->>Pelanggan: Instruksi bayar di kasir

    Pelanggan->>Kasir: Bayar tunai / QRIS / transfer
    Kasir->>App: Buka orders inbox lalu proses pesanan

    opt Bayar sekarang pay_now
        Kasir->>App: Konfirmasi pembayaran
        App->>SB: confirmPreOrderPayment
        SB->>SB: payment_status confirmed
    end

    App->>SB: processPreOrder
    activate SB
    SB->>SB: Buat transactions lunas dan kurangi stok
    SB->>SB: Insert order_queues status waiting
    SB->>SB: Update pre_orders status completed
    SB-->>App: Transaksi dan nomor antrian
    SB-->>Staff: Realtime broadcast antrian baru
    deactivate SB

    Staff->>App: Pickup Order
    App->>SB: pickupQueue
    activate SB
    SB->>SB: status preparing
    SB-->>App: Pickup berhasil
    deactivate SB

    Note over Staff: Staff memasak dan menyiapkan pesanan

    Staff->>App: Klik Siap
    App->>SB: markQueueReady
    activate SB
    SB->>SB: status ready
    SB-->>App: Pesanan siap diantar
    deactivate SB

    Staff->>App: Klik Antar
    App->>SB: markQueueServing
    activate SB
    SB->>SB: status serving
    SB-->>App: Pesanan sedang diantar
    deactivate SB

    Note over Staff,Pelanggan: Staff mengantarkan pesanan ke meja pelanggan

    Staff->>App: Klik Selesai
    App->>SB: completeQueue
    activate SB
    SB->>SB: status completed
    SB-->>App: Antrian selesai
    deactivate SB
```

| Tahap | Status di database | Halaman / aksi |
|-------|-------------------|----------------|
| Pre-order masuk | `pre_orders.status = pending` | `/order` → `createPreOrder()` |
| Menunggu bayar | `payment_status = unpaid` atau `awaiting_confirmation` | `/order/success` |
| Masuk antrian | `order_queues.status = waiting` | `/orders/inbox` → `processPreOrder()` |
| Disiapkan | `order_queues.status = preparing` | `/queue` → `pickupQueue()` |
| Siap diantar | `order_queues.status = ready` | `/queue` → `markQueueReady()` |
| Sedang diantar | `order_queues.status = serving` | `/queue` → `markQueueServing()` |
| Selesai | `order_queues.status = completed` | `/queue` → `completeQueue()` |

> **Catatan:** Kasir juga bisa membuat transaksi langsung di `/transactions` tanpa pre-order. Jika opsi antrian diaktifkan, alur dapur tetap: `waiting` → `preparing` → `ready` → `serving` → `completed`.

### 9. Makan Dulu, Bayar Nanti (Dine-in)

Aplikasi mendukung dua jenis pembayaran dine-in:

| Jenis | Kode / tombol | Kapan transaksi lunas | Saluran |
|-------|---------------|----------------------|---------|
| **Bayar dulu** | Kasir: Bayar / Bayar + Antrian · QR: `pay_now` | Saat pesanan dibuat / dikonfirmasi kasir | `/transactions`, `/order` → inbox |
| **Makan dulu, bayar nanti** | Kasir: Makan Dulu / Makan Dulu + Antrian · QR: `pay_later` | Setelah makan lewat `/transactions/open` | `/transactions`, `/order` → inbox |

Mode mana yang tersedia dikontrol lewat **`/config` → Mode Pembayaran Dine-in**:

| `payment_flow_mode` | Perilaku |
|---------------------|----------|
| `pay_first_only` | Hanya bayar dulu (takeaway / bayar di depan) |
| `eat_first_only` | Hanya makan dulu, bayar nanti (full dine-in) |
| `both` | Kasir dan pelanggan QR bisa memilih |

| `require_table_for_eat_first` | Perilaku |
|-------------------------------|----------|
| `true` (default) | Walk-in dan pre-order `pay_later` wajib nomor meja |
| `false` | Walk-in boleh hutang tanpa meja |

**Merge bon terbuka (hari yang sama, hanya makan dulu):**

- Pelanggan terdaftar → gabung per `customer_id`
- Walk-in → gabung per `table_number` (meja berbeda tidak tercampur)

---

#### 9.1 Kasir — Bayar Dulu

Pelanggan bayar di kasir sebelum pesanan diproses. Transaksi langsung `is_paid = true`. Tersedia jika `payment_flow_mode` bukan `eat_first_only`.

```mermaid
sequenceDiagram
    autonumber

    actor Pelanggan
    actor Kasir
    actor Staff as Staff Dapur

    participant App as Vue App
    participant SB as Supabase

    Pelanggan->>Kasir: Pilih menu di kasir
    Kasir->>App: Buka /transactions, pilih pelanggan, isi keranjang

    alt Bayar + Antrian
        Kasir->>App: Klik Bayar + Antrian, isi nomor meja (opsional)
        App->>App: Dialog metode bayar
        Kasir->>App: Pilih tunai / QRIS / transfer
    else Bayar saja
        Kasir->>App: Klik Bayar
        App->>App: Dialog metode bayar
        Kasir->>App: Pilih tunai / QRIS / transfer
    end

    App->>SB: createTransaction is_paid=true + payment_method
    activate SB
    SB->>SB: Kurangi stok
  opt Antrian aktif
        SB->>SB: Insert order_queues status waiting
        SB-->>Staff: Realtime antrian baru
    end
    SB-->>App: Transaksi lunas (+ nomor antrian)
    deactivate SB

    App-->>Kasir: Struk / konfirmasi sukses

    opt Ada antrian
        Staff->>App: waiting → preparing → ready → serving → completed
    end
```

| Tahap | Status di database | Halaman / aksi |
|-------|-------------------|----------------|
| Transaksi lunas | `transactions.is_paid = true`, `paid_at` terisi | `/transactions` → Bayar |
| Loyalitas (opsional) | `loyalty_points_earned`, `loyalty_points_redeemed`, ledger | Dialog bayar — tukar poin member |
| Antrian (opsional) | `order_queues.status = waiting` … `completed` | `/queue` |

---

#### 9.2 Kasir — Makan Dulu, Bayar Nanti

Bon terbuka (`is_paid = false`); pelanggan makan dulu, bayar setelah selesai. Tersedia jika `payment_flow_mode` bukan `pay_first_only`. Walk-in wajib nomor meja jika `require_table_for_eat_first = true`.

```mermaid
sequenceDiagram
    autonumber

    actor Pelanggan
    actor Kasir
    actor Staff as Staff Dapur

    participant App as Vue App
    participant SB as Supabase

    Pelanggan->>Kasir: Pesan dine-in
    Kasir->>App: Buka /transactions, pilih pelanggan / walk-in

    alt Walk-in + require_table_for_eat_first
        Kasir->>App: Isi nomor meja (wajib)
    else Pelanggan terdaftar
        Kasir->>App: Isi nomor meja (opsional)
    end

    Kasir->>App: Klik Makan Dulu + Antrian (atau Makan Dulu saja)
    App->>SB: createTransaction is_paid=false + table_number
    activate SB
    SB->>SB: Kurangi stok
    opt Antrian
        SB->>SB: Insert order_queues status waiting
        SB-->>Staff: Realtime antrian baru
    end
    SB-->>App: Bon terbuka dibuat
    deactivate SB

    Staff->>App: waiting → preparing → ready → serving → completed

    Note over Pelanggan,Kasir: Pelanggan selesai makan

    Pelanggan->>Kasir: Minta bon
    Kasir->>App: Buka /transactions/open
    Kasir->>App: Klik Bayar, pilih metode
    App->>SB: markTransactionAsPaid
    activate SB
    SB->>SB: is_paid=true, paid_at, shift_id
    SB-->>App: Transaksi lunas
    deactivate SB
```

| Tahap | Status di database | Halaman / aksi |
|-------|-------------------|----------------|
| Bon dibuka | `transactions.is_paid = false`, `status = active` | `/transactions` → Makan Dulu |
| Antrian dapur | `order_queues.status = waiting` … `completed` | `/queue` |
| Tagihan | `transactions.is_paid = true`, `paid_at` terisi | `/transactions/open` → Bayar |
| Loyalitas (opsional) | Poin ditukar & didapat saat `markTransactionAsPaid` | Dialog bayar — member saja |

---

#### 9.3 QR Pre-order — Bayar Sekarang (pay_now)

Pelanggan memilih **bayar di kasir** saat memesan lewat `/order`. Kasir harus konfirmasi pembayaran di inbox sebelum pesanan masuk dapur. Tersedia jika `payment_flow_mode` bukan `eat_first_only`.

```mermaid
sequenceDiagram
    autonumber

    actor Pelanggan
    actor Kasir
    actor Staff as Staff Dapur

    participant App as Vue App
    participant SB as Supabase

    Pelanggan->>App: Scan QR, buka /order, pilih pay_now
    App->>SB: createPreOrder payment_choice=pay_now
    activate SB
    SB->>SB: pre_orders status=pending, payment_status=awaiting_confirmation
    SB-->>App: Nomor pesanan
    deactivate SB
    App-->>Pelanggan: Instruksi bayar di kasir

    Pelanggan->>Kasir: Bayar tunai / QRIS / transfer
    Kasir->>App: Buka /orders/inbox, proses pesanan

    Kasir->>App: Konfirmasi pembayaran + metode bayar
    App->>SB: confirmPreOrderPayment
    SB->>SB: payment_status=confirmed

    Kasir->>App: Proses ke dapur (+ antrian opsional)
    App->>SB: processPreOrder + paymentMethod
    activate SB
    SB->>SB: createTransaction is_paid=true
    SB->>SB: Kurangi stok
    SB->>SB: Insert order_queues status waiting
    SB->>SB: pre_orders status=completed
    SB-->>Staff: Realtime antrian baru
    SB-->>App: Transaksi lunas + nomor antrian
    deactivate SB

    Staff->>App: waiting → preparing → ready → serving → completed
```

| Tahap | Status di database | Halaman / aksi |
|-------|-------------------|----------------|
| Pre-order masuk | `pre_orders.status = pending`, `payment_choice = pay_now` | `/order` |
| Menunggu bayar | `payment_status = awaiting_confirmation` | `/order/success` |
| Pembayaran dikonfirmasi | `payment_status = confirmed` | `/orders/inbox` → konfirmasi bayar |
| Masuk antrian | `transactions.is_paid = true`, `order_queues.status = waiting` | `/orders/inbox` → proses |
| Selesai dapur | `order_queues.status = completed` | `/queue` |

---

#### 9.4 QR Pre-order — Makan Dulu (pay_later)

Pelanggan memilih **makan dulu, bayar nanti** (default jika `eat_first_only`). Kasir langsung kirim ke dapur tanpa bayar; tagihan dibayar setelah makan. Tersedia jika `payment_flow_mode` bukan `pay_first_only`.

```mermaid
sequenceDiagram
    autonumber

    actor Pelanggan
    actor Kasir
    actor Staff as Staff Dapur

    participant App as Vue App
    participant SB as Supabase

    Pelanggan->>App: Scan QR, buka /order, pilih pay_later
    Pelanggan->>App: Isi nomor meja (wajib jika require_table_for_eat_first)
    App->>SB: createPreOrder payment_choice=pay_later + table_number
    activate SB
    SB->>SB: pre_orders status=pending, payment_status=unpaid
    SB-->>App: Nomor pesanan
    deactivate SB
    App-->>Pelanggan: Pesanan terkirim, tunggu dari dapur

    Kasir->>App: Buka /orders/inbox
    Kasir->>App: Klik Kirim ke Dapur (tanpa dialog bayar)
    App->>SB: processPreOrder tanpa paymentMethod
    activate SB
    SB->>SB: createTransaction is_paid=false + table_number
    SB->>SB: Kurangi stok
    SB->>SB: Insert order_queues status waiting
    SB->>SB: pre_orders status=completed
    SB-->>Staff: Realtime antrian baru
    SB-->>App: Bon terbuka + nomor antrian
    deactivate SB

    Staff->>App: waiting → preparing → ready → serving → completed

    Note over Pelanggan,Kasir: Pelanggan selesai makan

    Pelanggan->>Kasir: Minta bon
    Kasir->>App: Buka /transactions/open → Bayar
    App->>SB: markTransactionAsPaid
    SB-->>App: Transaksi lunas
```

| Tahap | Status di database | Halaman / aksi |
|-------|-------------------|----------------|
| Pre-order masuk | `pre_orders.status = pending`, `payment_choice = pay_later` | `/order` |
| Tanpa bayar di depan | `payment_status = unpaid` | `/order/success` |
| Bon + antrian | `transactions.is_paid = false`, `order_queues.status = waiting` | `/orders/inbox` → Kirim ke Dapur |
| Selesai makan | `order_queues.status = completed` | `/queue` |
| Tagihan | `transactions.is_paid = true` | `/transactions/open` → Bayar |

---

## Master Meja & Denah

> **DDL:** Jalankan [`30-dining_tables.ddl`](DDL/30-dining_tables.ddl), [`31-floor_tables_dining_table_fk.ddl`](DDL/31-floor_tables_dining_table_fk.ddl), dan [`32-dining_tables_owner_policies.ddl`](DDL/32-dining_tables_owner_policies.ddl) sebelum menggunakan fitur ini.

Alur yang disarankan:

1. **Master Data → Meja** (`/master/tables`): tambah nomor meja, jumlah kursi, dan status aktif.
2. **Denah → Edit** (`/floor-plan/edit`): pilih meja dari master lalu letakkan di kanvas.
3. **Kasir / Order**: pilih meja dari dropdown — hanya meja **tersedia** yang bisa dipilih.

**Ketersediaan (computed):**

| Status | Arti |
|--------|------|
| `inactive` | `is_active = false` di master (owner nonaktifkan meja) |
| `occupied` | Ada bon terbuka hari ini atau antrian aktif dengan nomor meja yang sama |
| `reserved` | Ada booking `pending`/`confirmed` hari ini yang belum check-in |
| `available` | Meja aktif dan tidak terisi |

Transaksi, antrian, dan pre-order tetap menyimpan `table_number` (teks) agar kompatibel dengan data lama; nilai diisi dari master saat dipilih dropdown.

---

## Reservasi Meja Terjadwal

> **DDL:** Jalankan [`33-table_bookings.ddl`](DDL/33-table_bookings.ddl), [`34-pre_orders_booking_id.ddl`](DDL/34-pre_orders_booking_id.ddl), [`35-shop_config_booking.ddl`](DDL/35-shop_config_booking.ddl), dan [`36-table_bookings_realtime.ddl`](DDL/36-table_bookings_realtime.ddl). Aktifkan fitur di **Konfigurasi → Reservasi Meja**.

```mermaid
flowchart LR
  Book["/book — pelanggan"]
  TB[(table_bookings)]
  PO[(pre_orders)]
  Floor["Denah — reserved"]
  Staff["/bookings — staff"]
  CheckIn["checkInBooking"]
  Queue["Antrian dapur"]
  Occupied["Denah — occupied"]

  Book --> TB
  Book --> PO
  TB --> Floor
  Staff --> CheckIn
  CheckIn --> Queue
  CheckIn --> Occupied
```

| Langkah | Status / data | Halaman |
|---------|---------------|---------|
| Pelanggan booking + menu | `table_bookings` + `pre_orders` terhubung | `/book` |
| Meja terblokir di slot | overlap `scheduled_at` + `duration_minutes` | — |
| Denah hari ini | `reserved` (belum check-in) | `/floor-plan` |
| Staff check-in | `checked_in`, buat transaksi + antrian dari pre-order | `/bookings` |
| Tamu makan | antrian aktif → `occupied` di denah | `/queue` |
| Bayar | meja kosong kembali | `/transactions/open` |

**Perbedaan dengan `/order`:** `/order` untuk pesanan langsung hari ini; `/book` untuk reservasi terjadwal dengan pemilihan meja penuh dan pre-order menu.

---

## Membership & Poin Loyalitas

> **DDL:** Jalankan [`39-customers_membership.ddl`](DDL/39-customers_membership.ddl), [`40-shop_config_loyalty.ddl`](DDL/40-shop_config_loyalty.ddl), [`41-customer_loyalty_ledger.ddl`](DDL/41-customer_loyalty_ledger.ddl), dan [`42-transactions_loyalty.ddl`](DDL/42-transactions_loyalty.ddl). Aktifkan di **Konfigurasi → Membership & Loyalty**, lalu tandai pelanggan sebagai **Member** di **Master Pembeli**.

Program loyalitas memberi poin kepada pelanggan terdaftar yang ditandai sebagai member. Walk-in dan non-member tidak ikut program ini.

```mermaid
flowchart TD
  Config["shop_config — loyalitas aktif"]
  Member["customers.is_member = true"]
  Pay["Transaksi lunas"]
  Redeem["Tukar poin di dialog bayar"]
  Earn["Dapat poin tetap per transaksi"]
  Ledger["customer_point_ledger"]
  Balance["customers.loyalty_points"]

  Config --> Pay
  Member --> Pay
  Pay --> Redeem
  Pay --> Earn
  Redeem --> Ledger
  Earn --> Ledger
  Ledger --> Balance
```

### Pengaturan (`/config`)

| Field | Arti |
|-------|------|
| `loyalty_enabled` | Aktif/nonaktif program |
| `loyalty_points_per_transaction` | Poin yang didapat setiap transaksi **lunas** (tetap per transaksi, bukan per nominal) |
| `loyalty_point_redeem_value` | Nilai Rupiah potongan per 1 poin yang ditukar (mis. `1000` = 1 poin = Rp 1.000) |
| `loyalty_minimum_transaction_amount` | Minimal **total transaksi (gross)** agar member mendapat poin; `0` = tanpa minimum |

### Syarat peserta

| Kondisi | Ikut loyalitas? |
|---------|-----------------|
| `is_member = true` dan `is_active = true` | Ya |
| Walk-in Customer | Tidak |
| Non-member | Tidak |

### Alur di kasir

1. Pilih pelanggan **member** di `/transactions` — saldo poin tampil di form.
2. Saat **Bayar** (pay now) atau **Bayar** dari bon terbuka / daftar transaksi, dialog pembayaran menampilkan input **Tukar poin**.
3. Total bayar = `gross_amount − (poin_ditukar × loyalty_point_redeem_value)`.
4. Setelah lunas, member mendapat `loyalty_points_per_transaction` poin jika `gross_amount ≥ loyalty_minimum_transaction_amount`.
5. Riwayat poin bisa dilihat di **Master Pembeli** (ikon riwayat pada baris member).

### Data yang tersimpan

| Tabel / kolom | Fungsi |
|---------------|--------|
| `customers.loyalty_points` | Saldo poin saat ini (cache untuk UI cepat) |
| `customer_point_ledger` | Audit trail: `earn`, `redeem`, `reverse_earn`, `reverse_redeem` |
| `transactions.gross_amount` | Subtotal sebelum diskon poin |
| `transactions.loyalty_discount_amount` | Potongan Rupiah dari poin |
| `transactions.loyalty_points_redeemed` | Poin yang ditukar pada transaksi |
| `transactions.loyalty_points_earned` | Poin yang didapat pada transaksi |

Pembatalan transaksi yang sudah lunas akan membalikkan perubahan poin (earn dibatalkan, poin yang ditukar dikembalikan).

### File kode terkait

- [`src/lib/loyalty.ts`](src/lib/loyalty.ts) — hitung redeem, apply saat bayar, reverse saat batal
- [`src/lib/transaction.ts`](src/lib/transaction.ts) — integrasi `createTransaction` & `markTransactionAsPaid`
- [`src/components/transactions/PaymentMethodDialog.vue`](src/components/transactions/PaymentMethodDialog.vue) — UI tukar poin
- [`src/components/masterdata/CustomerPointHistoryDialog.vue`](src/components/masterdata/CustomerPointHistoryDialog.vue) — riwayat poin

---

> **DDL:** Jalankan [`27-transactions_table_number.ddl`](DDL/27-transactions_table_number.ddl) dan [`28-shop_config_payment_flow.ddl`](DDL/28-shop_config_payment_flow.ddl) sebelum menggunakan fitur ini.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Login gagal "Invalid login credentials" | Cek email/password; pastikan user sudah confirmed di Supabase |
| Sign up tidak bisa login | Matikan **Confirm email** di Supabase Auth, atau konfirmasi lewat email |
| Setelah sign-up, `profiles` kosong | Jalankan [`21-auth_login_seed.ddl`](DDL/21-auth_login_seed.ddl) atau pastikan `03` + `04` sudah dijalankan |
| Login gagal "Email not confirmed" | Jalankan [`21-auth_login_seed.ddl`](DDL/21-auth_login_seed.ddl) atau matikan Confirm email di Dashboard Auth |
| User Dashboard tanpa baris `profiles` | Jalankan query backfill di bagian [Setup Profiles](#langkah-5--opsional-user-admin-via-dashboard) |
| Insert produk/pelanggan **403** | Jalankan [`94-masterdata_policies.ddl`](DDL/94-masterdata_policies.ddl) atau pastikan [`20-role_owner_policies.ddl`](DDL/20-role_owner_policies.ddl) + login sebagai owner |
| Upload QRIS gagal | Pastikan [`10-shop_config.ddl`](DDL/10-shop_config.ddl) sudah dijalankan (bucket `shop-assets`) |
| HPP selalu 0 | Isi **harga beli** saat tambah produk atau restock; data lama mungkin belum punya costing |
| Penjualan gagal "stok batch tidak mencukupi" | Restock dulu atau jalankan [`91-stock_movements_costing.ddl`](DDL/91-stock_movements_costing.ddl) untuk backfill batch |
| Variable env tidak terbaca | Nama harus `VITE_SUPERBASE_URL` dan `VITE_SUPERBASE_PUBLISH_KEY`; restart `pnpm dev` setelah ubah `.env` |
| Antrian tidak update otomatis | Jalankan [`13-order_queues_realtime.ddl`](DDL/13-order_queues_realtime.ddl), atau Database → Publications → `supabase_realtime` → tambah `order_queues` |
| Denah meja tidak update otomatis | Jalankan [`13-order_queues_realtime.ddl`](DDL/13-order_queues_realtime.ddl), [`36-table_bookings_realtime.ddl`](DDL/36-table_bookings_realtime.ddl), dan [`37-transactions_realtime.ddl`](DDL/37-transactions_realtime.ddl) — denah mendengarkan `order_queues`, `transactions`, dan `table_bookings` |
| Poin loyalitas tidak muncul / tidak bertambah | Pastikan DDL `39`–`42` sudah dijalankan; aktifkan di **Konfigurasi → Membership & Loyalty**; pelanggan harus `is_member = true` (bukan walk-in) |
| Tidak bisa tukar poin saat bayar | Cek saldo poin pelanggan; `loyalty_point_redeem_value` harus > 0; maksimal tukar dibatasi oleh total transaksi |
| Badge Live tidak muncul di Antrian | Pastikan sudah login; cek koneksi WebSocket ke Supabase tidak diblokir firewall |

---

## Lisensi

Proyek private — sesuaikan lisensi sesuai kebutuhan tim Anda.
