-- Jalankan di Supabase SQL Editor. Semua objek di schema mb178 (bukan public).
--
-- Jika sebelumnya Anda sempat membuat tabel mb178.* dengan tipe kolom yang berbeda,
-- opsi paling bersih adalah reset schema ini:
--   drop schema if exists mb178 cascade;
-- lalu jalankan ulang file ini.

create schema if not exists mb178;

create table if not exists mb178.stores (
  id text primary key,
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

-- Jika tabel sudah terlanjur dibuat tanpa kolom-kolom terbaru,
-- blok ALTER ini akan menambahkannya tanpa merusak data lama.
alter table mb178.stores
  add column if not exists slug text,
  add column if not exists name text,
  add column if not exists profile_image_url text,
  add column if not exists address text,
  add column if not exists whatsapp_link text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists average_rating numeric(3, 2) default 4.50,
  add column if not exists hide_zero_stock_from_catalog boolean default false,
  add column if not exists created_at timestamptz default now();

-- Pastikan constraint minimum ada (abaikan error jika sudah ada).
do $$
begin
  begin
    alter table mb178.stores alter column slug set not null;
  exception when others then
    null;
  end;

  begin
    alter table mb178.stores alter column name set not null;
  exception when others then
    null;
  end;

  begin
    if not exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'mb178'
        and t.relname = 'stores'
        and c.conname = 'stores_slug_key'
    ) then
      alter table mb178.stores add constraint stores_slug_key unique (slug);
    end if;
  exception when others then
    -- beberapa instance bisa sudah punya index/constraint dengan nama ini
    null;
  end;
end $$;

create table if not exists mb178.products (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references mb178.stores (id) on delete cascade,
  name text not null,
  price numeric(14, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  unit text not null default 'pcs',
  image_url text,
  created_at timestamptz not null default now()
);

-- Jika tabel products sudah ada tapi kolomnya berbeda, tambahkan kolom standar
-- yang dipakai aplikasi (tanpa menghapus kolom lama).
alter table mb178.products
  add column if not exists store_id text,
  add column if not exists name text,
  add column if not exists price numeric(14, 2),
  add column if not exists stock integer default 0,
  add column if not exists unit text default 'pcs',
  add column if not exists image_url text,
  add column if not exists created_at timestamptz default now();

do $$
begin
  begin
    alter table mb178.products alter column name set not null;
  exception when others then
    null;
  end;
  begin
    alter table mb178.products alter column stock set not null;
  exception when others then
    null;
  end;
end $$;

-- User aplikasi (NextAuth Credentials) tanpa email/konfirmasi.
-- Catatan: password disimpan dalam bentuk hash (scrypt) + salt.
create table if not exists mb178.app_users (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  password_hash text not null,
  password_salt text not null,
  name text,
  role text not null default 'customer', -- customer | owner | super_admin
  store_id text references mb178.stores (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Tambah kolom jika tabel sudah ada tapi belum lengkap
alter table mb178.app_users
  add column if not exists password_hash text,
  add column if not exists password_salt text,
  add column if not exists name text,
  add column if not exists role text default 'customer',
  add column if not exists store_id text,
  add column if not exists created_at timestamptz default now();

create table if not exists mb178.orders (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references mb178.stores (id) on delete cascade,
  channel text not null default 'online', -- online | offline
  payment_method text not null default 'transfer', -- transfer | cod | offline
  status text not null default 'pending', -- pending_payment | pending_cod | booked | paid | cancelled | completed
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

-- Seed toko demo.
-- Kompatibel untuk 2 kondisi:
-- - `mb178.stores.id` = text  -> pakai id text (contoh: 'pupuk-maju')
-- - `mb178.stores.id` = uuid  -> pakai `gen_random_uuid()` dan conflict di `slug`
do $$
declare
  id_type text;
  has_store_name boolean;
  has_name boolean;
begin
  select data_type
    into id_type
  from information_schema.columns
  where table_schema = 'mb178'
    and table_name = 'stores'
    and column_name = 'id';

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'mb178'
      and table_name = 'stores'
      and column_name = 'store_name'
  )
  into has_store_name;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'mb178'
      and table_name = 'stores'
      and column_name = 'name'
  )
  into has_name;

  if id_type = 'uuid' then
    execute (
      'insert into mb178.stores (id, slug, ' ||
      case
        when has_store_name and has_name then 'store_name, name, '
        when has_store_name then 'store_name, '
        when has_name then 'name, '
        else ''
      end ||
      'address, whatsapp_link, lat, lng) values ($1,$2,' ||
      case
        when has_store_name and has_name then '$3,$3,'
        when has_store_name then '$3,'
        when has_name then '$3,'
        else ''
      end ||
      '$4,$5,$6,$7) on conflict (slug) do nothing'
    )
    using
      gen_random_uuid(),
      'pupuk-maju',
      'Toko Pupuk MAJU BERSAMA',
      'Jl. Contoh No. 178, Jakarta',
      'https://wa.me/6281211172228',
      -6.2088,
      106.8456;

    execute (
      'insert into mb178.stores (id, slug, ' ||
      case
        when has_store_name and has_name then 'store_name, name, '
        when has_store_name then 'store_name, '
        when has_name then 'name, '
        else ''
      end ||
      'address, whatsapp_link) values ($1,$2,' ||
      case
        when has_store_name and has_name then '$3,$3,'
        when has_store_name then '$3,'
        when has_name then '$3,'
        else ''
      end ||
      '$4,$5) on conflict (slug) do nothing'
    )
    using
      gen_random_uuid(),
      'majubersamagrup',
      'MAJUBERSAMAGRUP',
      null,
      'https://wa.me/6281211172228';
  else
    insert into mb178.stores (id, slug, name, address, whatsapp_link, lat, lng)
    values (
      'pupuk-maju',
      'pupuk-maju',
      'Toko Pupuk MAJU BERSAMA',
      'Jl. Contoh No. 178, Jakarta',
      'https://wa.me/6281211172228',
      -6.2088,
      106.8456
    )
    on conflict (id) do nothing;

    insert into mb178.stores (id, slug, name, address, whatsapp_link)
    values (
      'majubersamagrup',
      'majubersamagrup',
      'MAJUBERSAMAGRUP',
      null,
      'https://wa.me/6281211172228'
    )
    on conflict (id) do nothing;
  end if;
end $$;

-- Bucket storage: buat `mb178_assets` di Dashboard → Storage (public read disarankan untuk URL gambar katalog)
