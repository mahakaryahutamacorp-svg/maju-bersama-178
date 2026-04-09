-- ============================================================
-- Setup lengkap untuk database Maju Bersama 178
-- Jalankan di Supabase SQL Editor (satu kali).
--
-- PENTING: Jika schema mb178 sudah ada dengan tabel lama,
-- jalankan dulu:
--   drop schema if exists mb178 cascade;
-- lalu jalankan file ini dari awal.
--
-- Pastikan Anda juga:
--   - Expose schema `mb178` di Supabase Dashboard → Settings → API → Exposed schemas
--   - Buat bucket `mb178_assets` di Dashboard → Storage (public read)
-- ============================================================

-- 1) Schema
create schema if not exists mb178;

-- 2) Tabel stores (id = uuid)
create table if not exists mb178.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  profile_image_url text,
  address text,
  whatsapp_link text,
  lat double precision,
  lng double precision,
  average_rating numeric(3, 2) not null default 4.50,
  hide_zero_stock_from_catalog boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3) Tabel products
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

-- 4) Tabel app_users (NextAuth credentials)
create table if not exists mb178.app_users (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  password_hash text not null,
  password_salt text not null,
  name text,
  role text not null default 'customer',
  store_id uuid references mb178.stores (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5) Tabel orders
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

-- 6) Tabel order_items
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
-- RLS Policies
-- ============================================================

alter table mb178.stores enable row level security;
alter table mb178.products enable row level security;
alter table mb178.app_users enable row level security;
alter table mb178.orders enable row level security;
alter table mb178.order_items enable row level security;

-- app_users: deny all for anon/authenticated (service role bypasses RLS)
drop policy if exists "app_users_deny_all" on mb178.app_users;
create policy "app_users_deny_all"
on mb178.app_users for all to anon, authenticated
using (false) with check (false);

-- stores: public read
drop policy if exists "stores_select_all" on mb178.stores;
create policy "stores_select_all"
on mb178.stores for select to anon, authenticated
using (true);

drop policy if exists "stores_block_insert" on mb178.stores;
create policy "stores_block_insert"
on mb178.stores for insert to anon, authenticated
with check (false);

drop policy if exists "stores_block_update" on mb178.stores;
create policy "stores_block_update"
on mb178.stores for update to anon, authenticated
using (false) with check (false);

drop policy if exists "stores_block_delete" on mb178.stores;
create policy "stores_block_delete"
on mb178.stores for delete to anon, authenticated
using (false);

-- products: public read
drop policy if exists "products_select_all" on mb178.products;
create policy "products_select_all"
on mb178.products for select to anon, authenticated
using (true);

drop policy if exists "products_block_insert" on mb178.products;
create policy "products_block_insert"
on mb178.products for insert to anon, authenticated
with check (false);

drop policy if exists "products_block_update" on mb178.products;
create policy "products_block_update"
on mb178.products for update to anon, authenticated
using (false) with check (false);

drop policy if exists "products_block_delete" on mb178.products;
create policy "products_block_delete"
on mb178.products for delete to anon, authenticated
using (false);

-- orders: public read
drop policy if exists "orders_select_all" on mb178.orders;
create policy "orders_select_all"
on mb178.orders for select to anon, authenticated
using (true);

drop policy if exists "orders_block_insert" on mb178.orders;
create policy "orders_block_insert"
on mb178.orders for insert to anon, authenticated
with check (false);

drop policy if exists "orders_block_update" on mb178.orders;
create policy "orders_block_update"
on mb178.orders for update to anon, authenticated
using (false) with check (false);

drop policy if exists "orders_block_delete" on mb178.orders;
create policy "orders_block_delete"
on mb178.orders for delete to anon, authenticated
using (false);

-- order_items: public read
drop policy if exists "order_items_select_all" on mb178.order_items;
create policy "order_items_select_all"
on mb178.order_items for select to anon, authenticated
using (true);

drop policy if exists "order_items_block_insert" on mb178.order_items;
create policy "order_items_block_insert"
on mb178.order_items for insert to anon, authenticated
with check (false);

drop policy if exists "order_items_block_update" on mb178.order_items;
create policy "order_items_block_update"
on mb178.order_items for update to anon, authenticated
using (false) with check (false);

drop policy if exists "order_items_block_delete" on mb178.order_items;
create policy "order_items_block_delete"
on mb178.order_items for delete to anon, authenticated
using (false);

-- ============================================================
-- Seed toko demo (stores.id = uuid, pakai slug untuk conflict)
-- ============================================================
insert into mb178.stores (slug, name, address, whatsapp_link, lat, lng)
values (
  'pupuk-maju',
  'Toko Pupuk MAJU BERSAMA',
  'Jl. Contoh No. 178, Jakarta',
  'https://wa.me/6281211172228',
  -6.2088,
  106.8456
)
on conflict (slug) do nothing;

insert into mb178.stores (slug, name, address, whatsapp_link)
values (
  'majubersamagrup',
  'MAJUBERSAMAGRUP',
  null,
  'https://wa.me/6281211172228'
)
on conflict (slug) do nothing;

-- ============================================================
-- Seed owner user: mama01 / 223344
-- Hash: scrypt (N=16384, r=8, p=1, keylen=32)
-- store_id diambil dari uuid toko 'pupuk-maju'
-- ============================================================
delete from mb178.app_users where user_id = 'mama01';

insert into mb178.app_users (user_id, password_hash, password_salt, name, role, store_id)
values (
  'mama01',
  'rY9IskvR/IljIIAISyUUyqvrR/NElCgH9xmOYwjZaRM=',
  'gfko9yEEHp3E8mWTirxpew==',
  'Mama',
  'owner',
  (select id from mb178.stores where slug = 'pupuk-maju' limit 1)
);
