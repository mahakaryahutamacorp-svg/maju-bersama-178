-- Schema mb178 — semua tabel untuk Maju Bersama 178
-- Jalankan di Supabase SQL Editor.
-- Untuk setup lengkap (schema + RLS + seed), gunakan setup-complete.sql.

create schema if not exists mb178;

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
  store_id uuid references mb178.stores (id) on delete set null,
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
