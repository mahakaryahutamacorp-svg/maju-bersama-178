-- ============================================================
-- Maju Bersama 178 — setup database di schema PUBLIC
--
-- Jalankan SELURUH skrip ini di Supabase → SQL Editor (satu kali / reset penuh).
--
-- Yang dilakukan:
--   1) Hapus schema lama aplikasi `mb178` (jika ada).
--   2) Reset schema `public` (menghapus SEMUA objek di public — proyek khusus app ini).
--   3) Buat ulang tabel + RLS + seed (8 toko, master, mb178, 8 owner, banners beranda).
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
-- LEGACY: tidak dipakai aplikasi untuk login (pakai Supabase Auth). Lihat COMMENT pasca-migrasi 20260415103000.
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
-- STORAGE — bucket `mb178_assets` (buat manual di Dashboard jika belum ada)
--   SELECT: bucket_id = 'mb178_assets'
--   INSERT/UPDATE/DELETE: tolak anon/authenticated (unggah via server + service role)
-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- 6) SEED: 8 toko (slug + nama selaras dengan file di public/toko_images/)
-- Urutan owner: mama01=pupuk-maju, toko02=pestisida-mbp, toko03=pakan-pei,
-- toko04=rosaura-skin-clinic, toko05=drg-sona, toko06=raniah-travel,
-- toko07=dapurku-seafood, toko08=rocell-gadget
-- ------------------------------------------------------------
INSERT INTO public.stores (
    slug,
    name,
    address,
    whatsapp_link,
    phone,
    lat,
    lng
  )
VALUES (
    'pupuk-maju',
    'Maju Bersama Pupuk & Alat Pertanian',
    'Jl. Contoh No. 178, Jakarta',
    'https://wa.me/6281211172228',
    '081211172228',
    -6.2088,
    106.8456
  ),
  (
    'pestisida-mbp',
    'Pestisida Maju Bersama',
    'Jl. Raya Mangga No. 5, Bekasi',
    'https://wa.me/6281211172228',
    '081211172228',
    -6.2416,
    106.9926
  ),
  (
    'pakan-pei',
    'Pakan PE''I Maju Bersama',
    'Jl. Sudirman No. 88, Jakarta',
    'https://wa.me/6281300001111',
    '081300001111',
    -6.2146,
    106.8451
  ),
  (
    'rosaura-skin-clinic',
    'Rosaura Skin Clinic',
    'Jl. Thamrin No. 12, Jakarta',
    'https://wa.me/6281300002222',
    '081300002222',
    -6.1954,
    106.8232
  ),
  (
    'drg-sona',
    'Klinik drg. Sona',
    'Jl. Gatot Subroto No. 45, Bandung',
    'https://wa.me/6281300003333',
    '081300003333',
    -6.9175,
    107.6191
  ),
  (
    'raniah-travel',
    'Raniah Travel Umroh dan Haji',
    'Jl. Pahlawan No. 99, Surabaya',
    'https://wa.me/6281300004444',
    '081300004444',
    -7.2575,
    112.7521
  ),
  (
    'dapurku-seafood',
    'Restoran Seafood Dapurku by Chef Hendra',
    'Jl. Diponegoro No. 33, Semarang',
    'https://wa.me/6281300005555',
    '081300005555',
    -6.9932,
    110.4203
  ),
  (
    'rocell-gadget',
    'Rocell Gadget',
    'Jl. Ahmad Yani No. 77, Medan',
    'https://wa.me/6281300006666',
    '081300006666',
    3.5952,
    98.6722
  ) ON CONFLICT (slug) DO NOTHING;
-- ------------------------------------------------------------
-- 7) SEED: akun (scrypt — lihat komentar password)
-- master / 178178 | mb178 / 178178 | mama01..toko08 / 223344
-- ------------------------------------------------------------
INSERT INTO public.app_users (
    user_id,
    password_hash,
    password_salt,
    name,
    role,
    store_id
  )
VALUES (
    'master',
    'EmURxzBC2gMeaZQ4t2V+7eILygDmI5Fsaf8lCzEksRs=',
    '/0cjlahTrXN20aTslXtkAg==',
    'Master Admin',
    'super_admin',
    NULL
  ),
  (
    'mb178',
    'EmURxzBC2gMeaZQ4t2V+7eILygDmI5Fsaf8lCzEksRs=',
    '/0cjlahTrXN20aTslXtkAg==',
    'Pemilik MB178',
    'super_admin',
    NULL
  ) ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.app_users (
    user_id,
    password_hash,
    password_salt,
    name,
    role,
    store_id
  )
VALUES (
    'mama01',
    'tNOLF2klvZkMjpWPdQOigeM04vkdolCie4Gx3H8eDaI=',
    '0U72bPhSp4a5ipnBCvcsBA==',
    'Mama',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'pupuk-maju'
    )
  ),
  (
    'toko02',
    'UXDaoFY9O1kbIUimG1bf3onTitVj39iNrNQlA5DPN5k=',
    'J+rJK6ID9HBNEgtf53t5nw==',
    'Owner MBG',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'pestisida-mbp'
    )
  ),
  (
    'toko03',
    'B/T3mtyzB813J0U7Rs0iNykU9b+CQtFJOCkMc8qbics=',
    'i87KA/LT4zmLxkh4KAw6zA==',
    'Owner Elektronik',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'pakan-pei'
    )
  ),
  (
    'toko04',
    'ae0/C6U1P2g+aMrSPMMRclzJjR0DvPM6cjC7DhlDEBM=',
    'g5ji06p9XBRSCUGZKkmJSA==',
    'Owner Fashion',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'rosaura-skin-clinic'
    )
  ),
  (
    'toko05',
    'xabjBQaueXT7ENbtO0ll+vdygxmyNGLDkSvIj+2PXDw=',
    'wNkBkQ17kUtH9H8RyBwCxg==',
    'Owner Bangunan',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'drg-sona'
    )
  ),
  (
    'toko06',
    'jIYP/J2oZO6OUi4ajf1rLBE3Bm+N3eO3rFrNeX/W3RQ=',
    'rK+VbwfVSHTKockwKm0Zww==',
    'Owner Sembako',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'raniah-travel'
    )
  ),
  (
    'toko07',
    'b4WkxYZ1Ej75IX6zBKyssC1wr/oVujH6pAhMd0bAvdo=',
    'mIShmaBhREUEn+wjUbCcFA==',
    'Owner ATK',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'dapurku-seafood'
    )
  ),
  (
    'toko08',
    'Mw3CyWw4siI6eXwdNgfb75QZrfCko91p8eClo/bUFso=',
    'DCmfiku/eVEDZ497qGE2ag==',
    'Owner Kosmetik',
    'owner',
    (
      SELECT id
      FROM public.stores
      WHERE slug = 'rocell-gadget'
    )
  ) ON CONFLICT (user_id) DO NOTHING;