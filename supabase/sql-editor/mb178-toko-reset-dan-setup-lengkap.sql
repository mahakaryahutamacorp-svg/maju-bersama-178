-- =============================================================================
-- MB178 — Reset data toko + DDL/RLS toko, admin membership, app_users (legacy)
-- Definisi & komentar kolom `stores`: lihat schema-public-stores-multistore.sql
-- =============================================================================
-- Isi:
--   A) Hapus semua baris toko & turunannya (sama seperti 00-hapus-data-*.sql)
--   B) Enum `store_role`, tabel `stores`, `app_users`, `store_memberships` (IF NOT EXISTS)
--   C) Indeks, GRANT, RLS + fungsi `has_store_role` (untuk owner/super_admin)
--   D) Seed persis 8 toko (nama kanonis = daftar bisnis MB178)
--
-- Prasyarat: migrasi auth-native (profiles, orders.customer_id, …) dan tabel
--   `products`, `orders`, `order_items`, `banners` sudah ada (mis. dari setup-complete
--   atau migrasi). File ini tidak DROP schema public.
--
-- Setelah seed: jalankan lagi `create-local-mb178-auth-users.sql` lalu
--   `20260414120000_seed_store_memberships.sql` agar owner/admin terhubung ke slug.
-- =============================================================================
BEGIN;
-- ---------------------------------------------------------------------------
-- A) Kosongkan data bergantung pada toko
-- ---------------------------------------------------------------------------
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.store_memberships;
DELETE FROM public.app_users;
DELETE FROM public.stores;
-- ---------------------------------------------------------------------------
-- B) Enum & tabel inti toko / legacy app_users / membership
-- ---------------------------------------------------------------------------
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname = 'store_role'
) THEN CREATE TYPE public.store_role AS ENUM ('customer', 'owner', 'super_admin');
END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.stores (
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
CREATE TABLE IF NOT EXISTS public.app_users (
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
COMMENT ON TABLE public.app_users IS 'LEGACY: tidak dipakai login aplikasi. Pakai Supabase Auth + store_memberships.';
CREATE TABLE IF NOT EXISTS public.store_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  role public.store_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_memberships_unique_user_store UNIQUE (user_id, store_id)
);
COMMENT ON TABLE public.store_memberships IS 'Peran user per toko: customer (opsional), owner, super_admin. Tulis via service_role / SQL admin.';
CREATE INDEX IF NOT EXISTS store_memberships_user_id_idx ON public.store_memberships (user_id);
CREATE INDEX IF NOT EXISTS store_memberships_store_id_idx ON public.store_memberships (store_id);
-- ---------------------------------------------------------------------------
-- C) Hak akses & RLS (toko + membership + profil baca diri)
-- ---------------------------------------------------------------------------
GRANT SELECT,
  UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.store_memberships TO authenticated;
GRANT SELECT ON public.stores TO anon,
  authenticated;
GRANT SELECT ON public.app_users TO authenticated;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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
-- --- stores: katalog publik baca; tulis hanya via service_role (policy blok) ---
DROP POLICY IF EXISTS "stores_select_all" ON public.stores;
DROP POLICY IF EXISTS "stores_block_writes" ON public.stores;
DROP POLICY IF EXISTS "stores_block_update" ON public.stores;
DROP POLICY IF EXISTS "stores_block_delete" ON public.stores;
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
-- --- app_users: blok total untuk client ---
DROP POLICY IF EXISTS "app_users_deny_all" ON public.app_users;
CREATE POLICY "app_users_deny_all" ON public.app_users FOR ALL TO anon,
authenticated USING (false) WITH CHECK (false);
-- --- store_memberships: baca baris sendiri; tulis via server ---
DROP POLICY IF EXISTS "store_memberships_select_own" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_insert_block" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_update_block" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_delete_block" ON public.store_memberships;
CREATE POLICY "store_memberships_select_own" ON public.store_memberships FOR
SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "store_memberships_insert_block" ON public.store_memberships FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "store_memberships_update_block" ON public.store_memberships FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "store_memberships_delete_block" ON public.store_memberships FOR DELETE TO authenticated USING (false);
-- --- profiles (customer / pemilik akun): selaras migrasi 033 ---
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_block" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_block" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR
SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_block" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "profiles_delete_block" ON public.profiles FOR DELETE TO authenticated USING (false);
-- ---------------------------------------------------------------------------
-- D) Seed 8 toko — nama persis daftar kanonis (slug tetap untuk app & gambar lokal)
-- Urutan beranda: created_at menaik (baris 1 = paling atas di UI sort created_at ASC)
-- ---------------------------------------------------------------------------
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
  );
COMMIT;