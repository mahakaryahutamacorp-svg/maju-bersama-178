-- ============================================================
-- Setup lengkap Maju Bersama 178 (satu-satunya entrypoint SQL)
-- Schema + RLS idempoten + seed: 8 toko + 8 owner + 1 master admin
--
-- PENTING: Jalankan di Supabase SQL Editor.
-- Reset penuh (hapus semua data mb178):
--   drop schema if exists mb178 cascade;
-- lalu jalankan file ini dari awal.
-- Seed toko & app_users memakai ON CONFLICT DO NOTHING — aman dijalankan ulang
-- jika baris dengan slug / user_id yang sama sudah ada.
--
-- Setelah itu:
--   - Expose schema `mb178` di Settings → Data API → Exposed schemas
--   - Buat bucket `mb178_assets` di Storage (baca publik untuk katalog;
--     upload hanya lewat server / service role — lihat komentar STORAGE di bawah)
-- ============================================================
create schema if not exists mb178;
-- ============================================================
-- TABEL (IF NOT EXISTS — aman jika schema sudah ada tanpa drop)
-- ============================================================
create table if not exists mb178.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  profile_image_url text,
  address text,
  whatsapp_link text,
  phone text,
  lat double precision,
  lng double precision,
  average_rating numeric(3, 2) not null default 4.50,
  hide_zero_stock_from_catalog boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists mb178.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references mb178.stores (id) on delete cascade,
  name text not null,
  price numeric(14, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  unit text not null default 'pcs',
  image_url text,
  created_at timestamptz not null default now()
);
create table if not exists mb178.app_users (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  password_hash text not null,
  password_salt text not null,
  name text,
  role text not null default 'customer',
  store_id uuid references mb178.stores (id) on delete
  set null,
    created_at timestamptz not null default now()
);
create table if not exists mb178.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references mb178.stores (id) on delete cascade,
  channel text not null default 'online',
  payment_method text not null default 'transfer',
  status text not null default 'pending',
  customer_name text,
  customer_phone text,
  notes text,
  total numeric(14, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);
create table if not exists mb178.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references mb178.orders (id) on delete cascade,
  product_id uuid not null references mb178.products (id) on delete restrict,
  name_snapshot text not null,
  unit_snapshot text not null,
  price_snapshot numeric(14, 2) not null check (price_snapshot >= 0),
  qty numeric(14, 3) not null check (qty > 0),
  line_total numeric(14, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
-- ============================================================
-- RLS (idempoten — drop policy if exists)
--
-- Login memakai NextAuth (bukan Supabase Auth): PostgREST tidak punya
-- auth.uid() untuk owner per-toko. Strategi: SELECT katalog untuk publik;
-- INSERT/UPDATE/DELETE via server + SERVICE ROLE (bypass RLS).
-- ============================================================
alter table mb178.stores enable row level security;
alter table mb178.products enable row level security;
alter table mb178.app_users enable row level security;
alter table mb178.orders enable row level security;
alter table mb178.order_items enable row level security;
-- Hapus nama policy lama (versi skrip sebelum penyatuan)
drop policy if exists "stores_read" on mb178.stores;
drop policy if exists "stores_no_insert" on mb178.stores;
drop policy if exists "stores_no_update" on mb178.stores;
drop policy if exists "stores_no_delete" on mb178.stores;
drop policy if exists "products_read" on mb178.products;
drop policy if exists "products_no_insert" on mb178.products;
drop policy if exists "products_no_update" on mb178.products;
drop policy if exists "products_no_delete" on mb178.products;
drop policy if exists "orders_read" on mb178.orders;
drop policy if exists "orders_no_insert" on mb178.orders;
drop policy if exists "orders_no_update" on mb178.orders;
drop policy if exists "orders_no_delete" on mb178.orders;
drop policy if exists "order_items_read" on mb178.order_items;
drop policy if exists "order_items_no_insert" on mb178.order_items;
drop policy if exists "order_items_no_update" on mb178.order_items;
drop policy if exists "order_items_no_delete" on mb178.order_items;
drop policy if exists "app_users_deny_all" on mb178.app_users;
create policy "app_users_deny_all" on mb178.app_users for all to anon,
authenticated using (false) with check (false);
drop policy if exists "stores_select_all" on mb178.stores;
create policy "stores_select_all" on mb178.stores for
select to anon,
  authenticated using (true);
drop policy if exists "products_select_all" on mb178.products;
create policy "products_select_all" on mb178.products for
select to anon,
  authenticated using (true);
drop policy if exists "stores_block_writes" on mb178.stores;
create policy "stores_block_writes" on mb178.stores for
insert to anon,
  authenticated with check (false);
drop policy if exists "stores_block_update" on mb178.stores;
create policy "stores_block_update" on mb178.stores for
update to anon,
  authenticated using (false) with check (false);
drop policy if exists "stores_block_delete" on mb178.stores;
create policy "stores_block_delete" on mb178.stores for delete to anon,
authenticated using (false);
drop policy if exists "products_block_writes" on mb178.products;
create policy "products_block_writes" on mb178.products for
insert to anon,
  authenticated with check (false);
drop policy if exists "products_block_update" on mb178.products;
create policy "products_block_update" on mb178.products for
update to anon,
  authenticated using (false) with check (false);
drop policy if exists "products_block_delete" on mb178.products;
create policy "products_block_delete" on mb178.products for delete to anon,
authenticated using (false);
drop policy if exists "orders_select_all" on mb178.orders;
create policy "orders_select_all" on mb178.orders for
select to anon,
  authenticated using (true);
drop policy if exists "orders_block_writes" on mb178.orders;
create policy "orders_block_writes" on mb178.orders for
insert to anon,
  authenticated with check (false);
drop policy if exists "orders_block_update" on mb178.orders;
create policy "orders_block_update" on mb178.orders for
update to anon,
  authenticated using (false) with check (false);
drop policy if exists "orders_block_delete" on mb178.orders;
create policy "orders_block_delete" on mb178.orders for delete to anon,
authenticated using (false);
drop policy if exists "order_items_select_all" on mb178.order_items;
create policy "order_items_select_all" on mb178.order_items for
select to anon,
  authenticated using (true);
drop policy if exists "order_items_block_writes" on mb178.order_items;
create policy "order_items_block_writes" on mb178.order_items for
insert to anon,
  authenticated with check (false);
drop policy if exists "order_items_block_update" on mb178.order_items;
create policy "order_items_block_update" on mb178.order_items for
update to anon,
  authenticated using (false) with check (false);
drop policy if exists "order_items_block_delete" on mb178.order_items;
create policy "order_items_block_delete" on mb178.order_items for delete to anon,
authenticated using (false);
-- ------------------------------------------------------------
-- STORAGE — bucket `mb178_assets`
-- Rekomendasi: bucket public read (gambar katalog); upload via server.
-- Blokir write langsung dari anon/authenticated.
-- Catatan: user SQL Editor sering bukan owner `storage.objects`, sehingga
-- ALTER/POLICY bisa gagal ("must be owner of table objects"). Kalau begitu,
-- atur lewat Dashboard: Storage → Policies → storage.objects:
--   SELECT: bucket_id = 'mb178_assets'
--   INSERT/UPDATE/DELETE: tolak anon/authenticated
-- Jika punya akses superuser, bisa uncomment blok SQL berikut:
-- ------------------------------------------------------------
-- alter table storage.objects enable row level security;
--
-- drop policy if exists "mb178_assets_public_read" on storage.objects;
-- create policy "mb178_assets_public_read"
-- on storage.objects
-- for select
-- to anon, authenticated
-- using (bucket_id = 'mb178_assets');
--
-- drop policy if exists "mb178_assets_block_writes" on storage.objects;
-- create policy "mb178_assets_block_writes"
-- on storage.objects
-- for all
-- to anon, authenticated
-- using (false)
-- with check (false);
-- ============================================================
-- SEED: 8 Toko (slug sudah ada → dilewati, tidak error)
-- ============================================================
insert into mb178.stores (
    slug,
    name,
    address,
    whatsapp_link,
    phone,
    lat,
    lng
  )
values (
    'pupuk-maju',
    'Toko Pupuk MAJU BERSAMA',
    'Jl. Contoh No. 178, Jakarta',
    'https://wa.me/6281211172228',
    '081211172228',
    -6.2088,
    106.8456
  ),
  (
    'majubersamagrup',
    'MAJUBERSAMAGRUP',
    'Jl. Raya Mangga No. 5, Bekasi',
    'https://wa.me/6281211172228',
    '081211172228',
    -6.2416,
    106.9926
  ),
  (
    'toko-elektronik',
    'Toko Elektronik Jaya',
    'Jl. Sudirman No. 88, Jakarta',
    'https://wa.me/6281300001111',
    '081300001111',
    -6.2146,
    106.8451
  ),
  (
    'fashion-murah',
    'Fashion Murah 178',
    'Jl. Thamrin No. 12, Jakarta',
    'https://wa.me/6281300002222',
    '081300002222',
    -6.1954,
    106.8232
  ),
  (
    'toko-bangunan',
    'Toko Bangunan Sentosa',
    'Jl. Gatot Subroto No. 45, Bandung',
    'https://wa.me/6281300003333',
    '081300003333',
    -6.9175,
    107.6191
  ),
  (
    'sembako-berkah',
    'Sembako Berkah',
    'Jl. Pahlawan No. 99, Surabaya',
    'https://wa.me/6281300004444',
    '081300004444',
    -7.2575,
    112.7521
  ),
  (
    'toko-alat-tulis',
    'Toko Alat Tulis Pintar',
    'Jl. Diponegoro No. 33, Semarang',
    'https://wa.me/6281300005555',
    '081300005555',
    -6.9932,
    110.4203
  ),
  (
    'toko-kosmetik',
    'Kosmetik Cantik 178',
    'Jl. Ahmad Yani No. 77, Medan',
    'https://wa.me/6281300006666',
    '081300006666',
    3.5952,
    98.6722
  ) on conflict (slug) do nothing;
-- ============================================================
-- SEED: 1 Master Admin + 8 Owner (password = 6 digit angka)
-- Hash: scrypt N=16384, r=8, p=1, keylen=32
--
-- master   / 178178
-- mama01   / 223344  → pupuk-maju
-- toko02   / 223344  → majubersamagrup
-- toko03   / 223344  → toko-elektronik
-- toko04   / 223344  → fashion-murah
-- toko05   / 223344  → toko-bangunan
-- toko06   / 223344  → sembako-berkah
-- toko07   / 223344  → toko-alat-tulis
-- toko08   / 223344  → toko-kosmetik
-- ============================================================
insert into mb178.app_users (
    user_id,
    password_hash,
    password_salt,
    name,
    role,
    store_id
  )
values (
    'master',
    'EmURxzBC2gMeaZQ4t2V+7eILygDmI5Fsaf8lCzEksRs=',
    '/0cjlahTrXN20aTslXtkAg==',
    'Master Admin',
    'super_admin',
    null
  ) on conflict (user_id) do nothing;
insert into mb178.app_users (
    user_id,
    password_hash,
    password_salt,
    name,
    role,
    store_id
  )
values (
    'mama01',
    'tNOLF2klvZkMjpWPdQOigeM04vkdolCie4Gx3H8eDaI=',
    '0U72bPhSp4a5ipnBCvcsBA==',
    'Mama',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'pupuk-maju'
    )
  ),
  (
    'toko02',
    'UXDaoFY9O1kbIUimG1bf3onTitVj39iNrNQlA5DPN5k=',
    'J+rJK6ID9HBNEgtf53t5nw==',
    'Owner MBG',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'majubersamagrup'
    )
  ),
  (
    'toko03',
    'B/T3mtyzB813J0U7Rs0iNykU9b+CQtFJOCkMc8qbics=',
    'i87KA/LT4zmLxkh4KAw6zA==',
    'Owner Elektronik',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'toko-elektronik'
    )
  ),
  (
    'toko04',
    'ae0/C6U1P2g+aMrSPMMRclzJjR0DvPM6cjC7DhlDEBM=',
    'g5ji06p9XBRSCUGZKkmJSA==',
    'Owner Fashion',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'fashion-murah'
    )
  ),
  (
    'toko05',
    'xabjBQaueXT7ENbtO0ll+vdygxmyNGLDkSvIj+2PXDw=',
    'wNkBkQ17kUtH9H8RyBwCxg==',
    'Owner Bangunan',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'toko-bangunan'
    )
  ),
  (
    'toko06',
    'jIYP/J2oZO6OUi4ajf1rLBE3Bm+N3eO3rFrNeX/W3RQ=',
    'rK+VbwfVSHTKockwKm0Zww==',
    'Owner Sembako',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'sembako-berkah'
    )
  ),
  (
    'toko07',
    'b4WkxYZ1Ej75IX6zBKyssC1wr/oVujH6pAhMd0bAvdo=',
    'mIShmaBhREUEn+wjUbCcFA==',
    'Owner ATK',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'toko-alat-tulis'
    )
  ),
  (
    'toko08',
    'Mw3CyWw4siI6eXwdNgfb75QZrfCko91p8eClo/bUFso=',
    'DCmfiku/eVEDZ497qGE2ag==',
    'Owner Kosmetik',
    'owner',
    (
      select id
      from mb178.stores
      where slug = 'toko-kosmetik'
    )
  ) on conflict (user_id) do nothing;