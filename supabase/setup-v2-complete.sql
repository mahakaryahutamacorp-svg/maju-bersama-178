-- ============================================================
-- Maju Bersama 178 — Setup & Migrations Consolidated V2
-- ============================================================

-- ============================================================
-- Maju Bersama 178 â€” setup database di schema PUBLIC
--
-- Jalankan SELURUH skrip ini di Supabase â†’ SQL Editor (satu kali / reset penuh).
--
-- Yang dilakukan:
--   1) Hapus schema lama aplikasi `mb178` (jika ada).
--   2) Reset schema `public` (menghapus SEMUA objek di public â€” proyek khusus app ini).
--   3) Buat ulang tabel + RLS + seed (8 toko kanonis, banners; tanpa seed app_users).
--
-- Setelah itu (Dashboard):
--   - Buat bucket Storage `mb178_assets` (publik baca untuk katalog; unggah via server).
--   - Tidak perlu menambah "Exposed schemas": `public` sudah default untuk PostgREST.
--
-- PERINGATAN: Jangan jalankan di proyek Supabase yang memakai `public` untuk hal lain.
-- ============================================================
-- ------------------------------------------------------------
-- 1) Hapus schema khusus lama
-- ------------------------------------------------------------
DROP SCHEMA IF EXISTS mb178 CASCADE;
-- ------------------------------------------------------------
-- 2) Kosongkan & buat ulang public + hak akses (Supabase)
-- ------------------------------------------------------------
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres,
  anon,
  authenticated,
  service_role;
GRANT ALL ON SCHEMA public TO postgres,
  service_role;
GRANT USAGE,
  CREATE ON SCHEMA public TO authenticated;
COMMENT ON SCHEMA public IS 'standard public schema';
-- Default privileges untuk objek baru ke depannya
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgres,
  service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO postgres,
  service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO postgres,
  service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT,
  INSERT,
  UPDATE,
  DELETE ON TABLES TO anon,
  authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON SEQUENCES TO anon,
  authenticated;
-- ------------------------------------------------------------
-- 3) Tabel
-- ------------------------------------------------------------
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  profile_image_url text,
  address text,
  whatsapp_link text,
  phone text,
  lat double precision,
  lng double precision,
  average_rating numeric(3, 2) NOT NULL DEFAULT 4.50,
  hide_zero_stock_from_catalog boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(14, 2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit text NOT NULL DEFAULT 'pcs',
  image_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- DEPRECATED: legacy credential table. Aplikasi memakai Supabase Auth (`auth.users`) + `public.profiles` / `public.store_memberships`. Jangan menambahkan logika app baru yang membaca `app_users`.
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'customer',
  store_id uuid REFERENCES public.stores (id) ON DELETE
  SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'online',
  payment_method text NOT NULL DEFAULT 'transfer',
  status text NOT NULL DEFAULT 'pending',
  customer_name text,
  customer_phone text,
  notes text,
  total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  name_snapshot text NOT NULL,
  unit_snapshot text NOT NULL,
  price_snapshot numeric(14, 2) NOT NULL CHECK (price_snapshot >= 0),
  qty numeric(14, 3) NOT NULL CHECK (qty > 0),
  line_total numeric(14, 2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Slider promosi beranda (URL gambar: Storage publik mb178_assets atau HTTPS lain yang diizinkan app)
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ------------------------------------------------------------
-- 4) Hak pada tabel yang baru dibuat (objek yang sudah ada sekarang)
-- ------------------------------------------------------------
GRANT SELECT,
  INSERT,
  UPDATE,
  DELETE ON ALL TABLES IN SCHEMA public TO anon,
  authenticated,
  service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon,
  authenticated,
  service_role;
-- ------------------------------------------------------------
-- 5) RLS
-- Katalog baca publik (anon); autentikasi aplikasi lewat Supabase Auth + store_memberships.
-- ------------------------------------------------------------
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_users_deny_all" ON public.app_users FOR ALL TO anon,
authenticated USING (false) WITH CHECK (false);
CREATE POLICY "stores_select_all" ON public.stores FOR
SELECT TO anon,
  authenticated USING (true);
CREATE POLICY "products_select_all" ON public.products FOR
SELECT TO anon,
  authenticated USING (true);
CREATE POLICY "stores_block_writes" ON public.stores FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
CREATE POLICY "stores_block_update" ON public.stores FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
CREATE POLICY "stores_block_delete" ON public.stores FOR DELETE TO anon,
authenticated USING (false);
CREATE POLICY "products_block_writes" ON public.products FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
CREATE POLICY "products_block_update" ON public.products FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
CREATE POLICY "products_block_delete" ON public.products FOR DELETE TO anon,
authenticated USING (false);
CREATE POLICY "orders_select_all" ON public.orders FOR
SELECT TO anon,
  authenticated USING (true);
CREATE POLICY "orders_block_writes" ON public.orders FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
CREATE POLICY "orders_block_update" ON public.orders FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
CREATE POLICY "orders_block_delete" ON public.orders FOR DELETE TO anon,
authenticated USING (false);
CREATE POLICY "order_items_select_all" ON public.order_items FOR
SELECT TO anon,
  authenticated USING (true);
CREATE POLICY "order_items_block_writes" ON public.order_items FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
CREATE POLICY "order_items_block_update" ON public.order_items FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
CREATE POLICY "order_items_block_delete" ON public.order_items FOR DELETE TO anon,
authenticated USING (false);
CREATE POLICY "banners_select_active" ON public.banners FOR
SELECT TO anon,
  authenticated USING (is_active = true);
CREATE POLICY "banners_block_insert" ON public.banners FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
CREATE POLICY "banners_block_update" ON public.banners FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
CREATE POLICY "banners_block_delete" ON public.banners FOR DELETE TO anon,
authenticated USING (false);
-- ------------------------------------------------------------
-- STORAGE â€” bucket `mb178_assets` (buat manual di Dashboard jika belum ada)
--   SELECT: bucket_id = 'mb178_assets'
--   INSERT/UPDATE/DELETE: tolak anon/authenticated (unggah via server + service role)
-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- 6) SEED: tepat 8 toko MB178 (nama kanonis; slug = public/toko_images/ & kode app)
-- Urutan beranda: ORDER BY created_at ASC â€” baris pertama = paling atas.
-- Admin toko: Supabase Auth + store_memberships (bukan app_users).
-- ------------------------------------------------------------
INSERT INTO public.stores (
    slug,
    name,
    address,
    whatsapp_link,
    phone,
    lat,
    lng,
    created_at
  )
VALUES (
    'pupuk-maju',
    'Maju Bersama Pupuk & Alat Pertanian',
    'Jl. Contoh No. 178, Jakarta',
    'https://wa.me/6281211172228',
    '081211172228',
    -6.2088,
    106.8456,
    '2026-01-01 00:00:01+07'::timestamptz
  ),
  (
    'rosaura-skin-clinic',
    'Rosaura Skin Clinic',
    'Jl. Thamrin No. 12, Jakarta',
    'https://wa.me/6281300002222',
    '081300002222',
    -6.1954,
    106.8232,
    '2026-01-01 00:00:02+07'::timestamptz
  ),
  (
    'raniah-travel',
    'Raniah Travel Umroh dan Haji',
    'Jl. Pahlawan No. 99, Surabaya',
    'https://wa.me/6281300004444',
    '081300004444',
    -7.2575,
    112.7521,
    '2026-01-01 00:00:03+07'::timestamptz
  ),
  (
    'pakan-pei',
    'Pakan PE''I Maju Bersama',
    'Jl. Sudirman No. 88, Jakarta',
    'https://wa.me/6281300001111',
    '081300001111',
    -6.2146,
    106.8451,
    '2026-01-01 00:00:04+07'::timestamptz
  ),
  (
    'drg-sona',
    'Klinik drg. Sona',
    'Jl. Gatot Subroto No. 45, Bandung',
    'https://wa.me/6281300003333',
    '081300003333',
    -6.9175,
    107.6191,
    '2026-01-01 00:00:05+07'::timestamptz
  ),
  (
    'rocell-gadget',
    'Rocell Gadget',
    'Jl. Ahmad Yani No. 77, Medan',
    'https://wa.me/6281300006666',
    '081300006666',
    3.5952,
    98.6722,
    '2026-01-01 00:00:06+07'::timestamptz
  ),
  (
    'pestisida-mbp',
    'Pestisida Maju Bersama',
    'Jl. Raya Mangga No. 5, Bekasi',
    'https://wa.me/6281211172228',
    '081211172228',
    -6.2416,
    106.9926,
    '2026-01-01 00:00:07+07'::timestamptz
  ),
  (
    'dapurku-seafood',
    'Restoran Seafood Dapurku by Chef Hendra',
    'Jl. Diponegoro No. 33, Semarang',
    'https://wa.me/6281300005555',
    '081300005555',
    -6.9932,
    110.4203,
    '2026-01-01 00:00:08+07'::timestamptz
  ) ON CONFLICT (slug) DO NOTHING;
-- ------------------------------------------------------------
-- 7) app_users: tabel legacy dikosongkan (tanpa seed). Login = Supabase Auth.
--    Owner & super_admin: supabase/sql-editor/create-local-mb178-auth-users.sql
--    lalu supabase/migrations/20260414120000_seed_store_memberships.sql
-- ------------------------------------------------------------

-- --- MIGRATION 1: Schema ---
-- Auth-native multi-tenant schema for MB178
-- This migration introduces:
-- - public.profiles (1:1 with auth.users)
-- - public.store_memberships (user<->store roles)
-- - orders.customer_id for customer-owned orders
-- - helper functions + trigger to auto-provision profiles
BEGIN;
-- 1) Profiles (one per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- 2) Store memberships
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname = 'store_role'
) THEN CREATE TYPE public.store_role AS ENUM ('customer', 'owner', 'super_admin');
END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.store_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  role public.store_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_memberships_unique_user_store UNIQUE (user_id, store_id)
);
CREATE INDEX IF NOT EXISTS store_memberships_user_id_idx ON public.store_memberships (user_id);
CREATE INDEX IF NOT EXISTS store_memberships_store_id_idx ON public.store_memberships (store_id);
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
-- 3) Orders: attach customer identity
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users (id) ON DELETE
SET NULL;
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders (customer_id);
-- 4) Provisioning: create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
COMMIT;

-- --- MIGRATION 2: RLS ---
-- RLS hardening for Auth-native multi-tenant access
-- Goals:
-- - profiles: user can read/update own profile
-- - store_memberships: user can read own memberships; only service_role can write
-- - orders/order_items: customer can access own orders; owner/super_admin can access store orders
-- - remove any wide-open policies left from initial setup scripts
BEGIN;
-- Grants (explicit, avoids relying on default privileges)
GRANT SELECT,
  UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.store_memberships TO authenticated;
GRANT SELECT,
  INSERT,
  UPDATE ON public.orders TO authenticated;
GRANT SELECT,
  INSERT ON public.order_items TO authenticated;
-- Ensure RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
-- Helper: check membership role for a store (read-only, safe under RLS usage)
CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles public.store_role []) RETURNS boolean LANGUAGE sql STABLE
SET search_path = public AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.store_memberships m
    WHERE m.user_id = auth.uid()
      AND m.store_id = p_store_id
      AND m.role = ANY (p_roles)
  );
$$;
-- -------------------------
-- profiles policies
-- -------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_block" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_block" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR
SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- block client inserts/deletes (handled by trigger/service role)
CREATE POLICY "profiles_insert_block" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "profiles_delete_block" ON public.profiles FOR DELETE TO authenticated USING (false);
-- -------------------------
-- store_memberships policies
-- -------------------------
DROP POLICY IF EXISTS "store_memberships_select_own" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_insert_block" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_update_block" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_delete_block" ON public.store_memberships;
CREATE POLICY "store_memberships_select_own" ON public.store_memberships FOR
SELECT TO authenticated USING (user_id = auth.uid());
-- No client writes to membership table (admin/server only)
CREATE POLICY "store_memberships_insert_block" ON public.store_memberships FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "store_memberships_update_block" ON public.store_memberships FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "store_memberships_delete_block" ON public.store_memberships FOR DELETE TO authenticated USING (false);
-- -------------------------
-- orders policies
-- -------------------------
-- Remove dangerous legacy policies if they exist.
DROP POLICY IF EXISTS "orders_select_all" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_all" ON public.order_items;
DROP POLICY IF EXISTS "orders_select_customer_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner_store" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_owner_store" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_block" ON public.orders;
-- Customer can read own orders
CREATE POLICY "orders_select_customer_own" ON public.orders FOR
SELECT TO authenticated USING (customer_id = auth.uid());
-- Owner/super_admin can read orders for stores they manage
CREATE POLICY "orders_select_owner_store" ON public.orders FOR
SELECT TO authenticated USING (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  );
-- Customer can create own orders (must set customer_id=auth.uid())
CREATE POLICY "orders_insert_customer_own" ON public.orders FOR
INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
-- Owner/super_admin can update orders in their store (e.g. status)
CREATE POLICY "orders_update_owner_store" ON public.orders FOR
UPDATE TO authenticated USING (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  ) WITH CHECK (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  );
-- Block deletes from client (server-only)
CREATE POLICY "orders_delete_block" ON public.orders FOR DELETE TO authenticated USING (false);
-- -------------------------
-- order_items policies
-- -------------------------
DROP POLICY IF EXISTS "order_items_select_customer_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_owner_store" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_customer_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_block" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_block" ON public.order_items;
-- Customer can read items for own orders
CREATE POLICY "order_items_select_customer_own" ON public.order_items FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );
-- Owner/super_admin can read items for store orders they manage
CREATE POLICY "order_items_select_owner_store" ON public.order_items FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND public.has_store_role(
          o.store_id,
          ARRAY ['owner', 'super_admin']::public.store_role []
        )
    )
  );
-- Customer can insert order items only for orders they own
CREATE POLICY "order_items_insert_customer_own" ON public.order_items FOR
INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );
-- No client updates/deletes of items (server-only)
CREATE POLICY "order_items_update_block" ON public.order_items FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "order_items_delete_block" ON public.order_items FOR DELETE TO authenticated USING (false);
COMMIT;

-- --- MIGRATION 3: RPC ---
-- Atomic checkout: one order + order_items + stock decrement (single transaction).
-- Invoked only with service_role from trusted Server Action after session verification.
BEGIN;

CREATE OR REPLACE FUNCTION public.mb178_checkout(
  p_customer_id uuid,
  p_store_id uuid,
  p_channel text,
  p_payment_method text,
  p_customer_name text,
  p_customer_phone text,
  p_notes text,
  p_items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_order_id uuid;
  r jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_name text;
  v_unit text;
  v_price numeric;
  v_stock integer;
  v_line_total numeric;
  v_total numeric := 0;
BEGIN
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id required';
  END IF;
  IF p_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id required';
  END IF;
  IF jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'empty cart';
  END IF;

  -- Validate lines, lock rows (product_id order), compute total
  FOR r IN
  SELECT
    value
  FROM
    jsonb_array_elements(p_items) AS t(value)
  ORDER BY
    (value ->> 'product_id')
  LOOP
    v_product_id := (r ->> 'product_id')::uuid;
    v_qty := (r ->> 'qty')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty <> trunc(v_qty) THEN
      RAISE EXCEPTION 'invalid qty for product %', v_product_id;
    END IF;
    SELECT
      p.name,
      p.unit,
      p.price,
      p.stock INTO v_name,
      v_unit,
      v_price,
      v_stock
    FROM
      public.products p
    WHERE
      p.id = v_product_id
      AND p.store_id = p_store_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'product % not in store', v_product_id;
    END IF;
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'insufficient stock for product %', v_product_id;
    END IF;
    v_line_total := round(v_price * v_qty, 2);
    v_total := v_total + v_line_total;
  END LOOP;

  INSERT INTO public.orders (
      store_id,
      channel,
      payment_method,
      status,
      customer_id,
      customer_name,
      customer_phone,
      notes,
      total
    )
  VALUES (
      p_store_id,
      coalesce(nullif(trim(p_channel), ''), 'online'),
      coalesce(nullif(trim(p_payment_method), ''), 'transfer'),
      'pending',
      p_customer_id,
      nullif(trim(p_customer_name), ''),
      nullif(trim(p_customer_phone), ''),
      nullif(trim(p_notes), ''),
      v_total
    )
  RETURNING
    id INTO v_order_id;

  FOR r IN
  SELECT
    value
  FROM
    jsonb_array_elements(p_items) AS t(value)
  ORDER BY
    (value ->> 'product_id')
  LOOP
    v_product_id := (r ->> 'product_id')::uuid;
    v_qty := (r ->> 'qty')::numeric;
    SELECT
      p.name,
      p.unit,
      p.price,
      p.stock INTO v_name,
      v_unit,
      v_price,
      v_stock
    FROM
      public.products p
    WHERE
      p.id = v_product_id
      AND p.store_id = p_store_id
    FOR UPDATE;
    v_line_total := round(v_price * v_qty, 2);
    INSERT INTO public.order_items (
        order_id,
        product_id,
        name_snapshot,
        unit_snapshot,
        price_snapshot,
        qty,
        line_total
      )
    VALUES (
        v_order_id,
        v_product_id,
        v_name,
        v_unit,
        v_price,
        v_qty,
        v_line_total
      );
    UPDATE
      public.products
    SET
      stock = stock - v_qty::integer
    WHERE
      id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mb178_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mb178_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb
) TO service_role;

COMMENT ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb) IS 'Atomic checkout: insert order + order_items and decrement stock. Invoke only from trusted server (service_role).';

COMMIT;


-- --- MIGRATION 4: Trigger ---
-- Perkaya handle_new_auth_user: full_name dari auth.users.raw_user_meta_data (+ fallback).
-- Sinkronkan public.profiles untuk setiap user yang punya baris di public.store_memberships.
BEGIN;
CREATE OR REPLACE FUNCTION public.profile_display_name_from_user_meta(p_meta jsonb, p_email text) RETURNS text LANGUAGE sql IMMUTABLE
SET search_path = public AS $$
SELECT COALESCE(
    NULLIF(trim(p_meta->>'full_name'), ''),
    NULLIF(trim(p_meta->>'name'), ''),
    NULLIF(trim(p_meta->>'display_name'), ''),
    NULLIF(
      trim(
        concat_ws(
          ' ',
          NULLIF(trim(p_meta->>'given_name'), ''),
          NULLIF(trim(p_meta->>'family_name'), '')
        )
      ),
      ''
    ),
    NULLIF(trim(p_email), '')
  );
$$;
COMMENT ON FUNCTION public.profile_display_name_from_user_meta(jsonb, text) IS 'Nama tampilan profil: prioritas raw_user_meta_data (full_name, name, display_name, given_name+family_name), lalu email.';
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (
    NEW.id,
    public.profile_display_name_from_user_meta(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      NEW.email
    )
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Trigger auth.users INSERT: isi public.profiles dari raw_user_meta_data (lihat profile_display_name_from_user_meta).';
-- Pastikan profil ada + full_name selaras dengan metadata Auth untuk pemilik membership
INSERT INTO public.profiles (id, full_name)
SELECT DISTINCT u.id,
  public.profile_display_name_from_user_meta(
    COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    u.email
  )
FROM auth.users u
  INNER JOIN public.store_memberships m ON m.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = u.id
  ) ON CONFLICT (id) DO NOTHING;
UPDATE public.profiles p
SET full_name = synced.full_name
FROM (
    SELECT DISTINCT u.id,
      public.profile_display_name_from_user_meta(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        u.email
      ) AS full_name
    FROM auth.users u
      INNER JOIN public.store_memberships m ON m.user_id = u.id
  ) AS synced
WHERE p.id = synced.id
  AND (
    p.full_name IS DISTINCT
    FROM synced.full_name
  );
COMMIT;

-- --- MIGRATION 5: Seed Memberships ---
-- Seed public.store_memberships for owner + super_admin accounts.
--
-- Prerequisite: each account must exist in Supabase Auth with email:
--   {username}@local.mb178
-- matching the login form (e.g. mama01 â†’ mama01@local.mb178).
--
-- Owner mapping aligns with public.stores slugs (post migrate-stores-to-toko-images):
--   mama01  â†’ pupuk-maju
--   toko02  â†’ pestisida-mbp
--   toko03  â†’ pakan-pei
--   toko04  â†’ rosaura-skin-clinic
--   toko05  â†’ drg-sona
--   toko06  â†’ raniah-travel
--   toko07  â†’ dapurku-seafood
--   toko08  â†’ rocell-gadget
--
-- Super admins (master, mb178): one row per store so RLS has_store_role() applies
-- for orders/products in any selected store.
--
-- Run via Supabase SQL Editor or `supabase db push` after migrations 202604141031 / 033.

BEGIN;

INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT u.id,
  s.id,
  'owner'::public.store_role
FROM auth.users u
JOIN (
  VALUES ('mama01@local.mb178', 'pupuk-maju'),
    ('toko02@local.mb178', 'pestisida-mbp'),
    ('toko03@local.mb178', 'pakan-pei'),
    ('toko04@local.mb178', 'rosaura-skin-clinic'),
    ('toko05@local.mb178', 'drg-sona'),
    ('toko06@local.mb178', 'raniah-travel'),
    ('toko07@local.mb178', 'dapurku-seafood'),
    ('toko08@local.mb178', 'rocell-gadget')
) AS m(email, slug) ON lower(u.email) = lower(m.email)
JOIN public.stores s ON s.slug = m.slug
ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO UPDATE
SET role = EXCLUDED.role;

INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT u.id,
  s.id,
  'super_admin'::public.store_role
FROM auth.users u
CROSS JOIN public.stores s
WHERE lower(u.email) IN ('master@local.mb178', 'mb178@local.mb178')
ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO UPDATE
SET role = EXCLUDED.role;

COMMIT;

