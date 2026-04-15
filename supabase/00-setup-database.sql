-- =============================================================================
-- Maju Bersama 178 (mahakaryahutama) — Database Setup Lengkap
-- =============================================================================
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Isi:
--   1) Reset & grants schema public
--   2) Tabel: stores, products, orders, order_items, banners, app_users (legacy)
--   3) Tabel auth-native: profiles, store_memberships
--   4) RLS policies
--   5) Functions & triggers
--   6) Seed 8 toko kanonis + banners
--   7) Checkout RPC
-- =============================================================================
-- ============================================================
-- 1) Reset schema public (hati-hati: menghapus SEMUA objek di public)
-- ============================================================
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
COMMENT ON SCHEMA public IS 'Maju Bersama 178 - mahakaryahutama';
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
-- ============================================================
-- 2) Enum & Tabel Utama
-- ============================================================
-- Enum store_role
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname = 'store_role'
) THEN CREATE TYPE public.store_role AS ENUM ('customer', 'owner', 'super_admin');
END IF;
END $$;
-- Tabel stores (katalog toko)
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
COMMENT ON TABLE public.stores IS 'Katalog toko MB178; slug selaras public/toko_images/ & kode aplikasi.';
-- Tabel products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(14, 2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit text NOT NULL DEFAULT 'pcs',
  image_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Tabel orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE
  SET NULL,
    channel text NOT NULL DEFAULT 'online',
    payment_method text NOT NULL DEFAULT 'transfer',
    status text NOT NULL DEFAULT 'pending',
    customer_name text,
    customer_phone text,
    notes text,
    total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_id_idx ON public.orders(customer_id);
-- Tabel order_items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name_snapshot text NOT NULL,
  unit_snapshot text NOT NULL,
  price_snapshot numeric(14, 2) NOT NULL CHECK (price_snapshot >= 0),
  qty numeric(14, 3) NOT NULL CHECK (qty > 0),
  line_total numeric(14, 2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Tabel banners (slider promosi)
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Tabel app_users (LEGACY - tidak dipakai untuk login)
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'customer',
  store_id uuid REFERENCES public.stores(id) ON DELETE
  SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.app_users IS 'LEGACY: tidak dipakai login aplikasi. Pakai Supabase Auth + store_memberships.';
-- Tabel profiles (1:1 dengan auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Tabel store_memberships (relasi user-store dengan role)
CREATE TABLE public.store_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role public.store_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_memberships_unique_user_store UNIQUE (user_id, store_id)
);
CREATE INDEX store_memberships_user_id_idx ON public.store_memberships(user_id);
CREATE INDEX store_memberships_store_id_idx ON public.store_memberships(store_id);
COMMENT ON TABLE public.store_memberships IS 'Peran user per toko: customer, owner, super_admin. Tulis via service_role / SQL admin.';
-- ============================================================
-- 3) Grants eksplisit
-- ============================================================
GRANT SELECT,
  INSERT,
  UPDATE,
  DELETE ON ALL TABLES IN SCHEMA public TO anon,
  authenticated,
  service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon,
  authenticated,
  service_role;
GRANT SELECT,
  UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.store_memberships TO authenticated;
-- ============================================================
-- 4) Enable RLS
-- ============================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- 5) Helper function: has_store_role
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles public.store_role []) RETURNS boolean LANGUAGE sql STABLE
SET search_path = public AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.store_memberships m
    WHERE m.user_id = auth.uid()
      AND m.store_id = p_store_id
      AND m.role = ANY(p_roles)
  );
$$;
-- ============================================================
-- 6) RLS Policies
-- ============================================================
-- stores: katalog publik baca; tulis hanya via service_role
CREATE POLICY "stores_select_all" ON public.stores FOR
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
-- products: katalog publik baca; tulis via service_role
CREATE POLICY "products_select_all" ON public.products FOR
SELECT TO anon,
  authenticated USING (true);
CREATE POLICY "products_block_writes" ON public.products FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
CREATE POLICY "products_block_update" ON public.products FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
CREATE POLICY "products_block_delete" ON public.products FOR DELETE TO anon,
authenticated USING (false);
-- banners: baca yang aktif saja
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
-- app_users: blok total untuk client (legacy)
CREATE POLICY "app_users_deny_all" ON public.app_users FOR ALL TO anon,
authenticated USING (false) WITH CHECK (false);
-- profiles: user hanya bisa baca/update profil sendiri
CREATE POLICY "profiles_select_own" ON public.profiles FOR
SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_block" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "profiles_delete_block" ON public.profiles FOR DELETE TO authenticated USING (false);
-- store_memberships: baca baris sendiri; tulis via server
CREATE POLICY "store_memberships_select_own" ON public.store_memberships FOR
SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "store_memberships_insert_block" ON public.store_memberships FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "store_memberships_update_block" ON public.store_memberships FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "store_memberships_delete_block" ON public.store_memberships FOR DELETE TO authenticated USING (false);
-- orders: customer baca pesanan sendiri; owner/super_admin baca pesanan toko
CREATE POLICY "orders_select_customer_own" ON public.orders FOR
SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "orders_select_owner_store" ON public.orders FOR
SELECT TO authenticated USING (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  );
CREATE POLICY "orders_insert_customer_own" ON public.orders FOR
INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
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
CREATE POLICY "orders_delete_block" ON public.orders FOR DELETE TO authenticated USING (false);
-- order_items: customer baca item pesanan sendiri; owner/super_admin baca item toko
CREATE POLICY "order_items_select_customer_own" ON public.order_items FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );
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
CREATE POLICY "order_items_insert_customer_own" ON public.order_items FOR
INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );
CREATE POLICY "order_items_update_block" ON public.order_items FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "order_items_delete_block" ON public.order_items FOR DELETE TO authenticated USING (false);
-- ============================================================
-- 7) Trigger: auto-create profile on auth.users insert
-- ============================================================
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
COMMENT ON FUNCTION public.profile_display_name_from_user_meta(jsonb, text) IS 'Nama tampilan profil dari raw_user_meta_data atau email.';
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
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Trigger auth.users INSERT: buat public.profiles otomatis.';
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
-- ============================================================
-- 8) Checkout RPC (atomic transaction)
-- ============================================================
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
DECLARE v_order_id uuid;
r jsonb;
v_product_id uuid;
v_qty numeric;
v_name text;
v_unit text;
v_price numeric;
v_stock integer;
v_line_total numeric;
v_total numeric := 0;
BEGIN IF p_customer_id IS NULL THEN RAISE EXCEPTION 'customer_id required';
END IF;
IF p_store_id IS NULL THEN RAISE EXCEPTION 'store_id required';
END IF;
IF jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'empty cart';
END IF;
-- Validate & lock products
FOR r IN
SELECT value
FROM jsonb_array_elements(p_items) AS t(value)
ORDER BY (value->>'product_id') LOOP v_product_id := (r->>'product_id')::uuid;
v_qty := (r->>'qty')::numeric;
IF v_qty IS NULL
OR v_qty <= 0
OR v_qty <> trunc(v_qty) THEN RAISE EXCEPTION 'invalid qty for product %',
v_product_id;
END IF;
SELECT p.name,
  p.unit,
  p.price,
  p.stock INTO v_name,
  v_unit,
  v_price,
  v_stock
FROM public.products p
WHERE p.id = v_product_id
  AND p.store_id = p_store_id FOR
UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'product % not in store',
v_product_id;
END IF;
IF v_stock < v_qty THEN RAISE EXCEPTION 'insufficient stock for product %',
v_product_id;
END IF;
v_line_total := round(v_price * v_qty, 2);
v_total := v_total + v_line_total;
END LOOP;
-- Create order
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
RETURNING id INTO v_order_id;
-- Insert order items & decrement stock
FOR r IN
SELECT value
FROM jsonb_array_elements(p_items) AS t(value)
ORDER BY (value->>'product_id') LOOP v_product_id := (r->>'product_id')::uuid;
v_qty := (r->>'qty')::numeric;
SELECT p.name,
  p.unit,
  p.price,
  p.stock INTO v_name,
  v_unit,
  v_price,
  v_stock
FROM public.products p
WHERE p.id = v_product_id
  AND p.store_id = p_store_id FOR
UPDATE;
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
UPDATE public.products
SET stock = stock - v_qty::integer
WHERE id = v_product_id;
END LOOP;
RETURN v_order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb) TO service_role;
COMMENT ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb) IS 'Atomic checkout: insert order + order_items and decrement stock. Invoke only from trusted server (service_role).';
-- ============================================================
-- 9) Seed 8 Toko Kanonis
-- ============================================================
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
-- ============================================================
-- 10) Seed Banners
-- ============================================================
INSERT INTO public.banners (image_url, title, is_active)
VALUES ('/banners/banners01.jpg', 'Promo 1', true),
  ('/banners/banners02.jpg', 'Promo 2', true),
  ('/banners/banners03.jpg', 'Promo 3', true) ON CONFLICT DO NOTHING;
-- ============================================================
-- Done! Selanjutnya jalankan 01-create-auth-users.sql
-- ============================================================