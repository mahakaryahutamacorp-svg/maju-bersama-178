-- =============================================================================
-- MB178 — Tabel `public.stores` (multi-store): definisi kanonis + komentar kolom
-- =============================================================================
-- Gambar Table Editor menunjukkan inti bisnis per toko:
--   id, slug, name, profile_image_url, address, whatsapp_link, phone, lat, lng
-- Aplikasi Next.js juga memakai kolom tambahan untuk katalog & dashboard owner.
--
-- Relasi multi-store:
--   products.store_id  → stores.id (katalog per toko)
--   orders.store_id     → stores.id (pesanan per toko)
--   store_memberships.store_id → stores.id + auth.users (owner / super_admin / customer)
--
-- Slug WAJIB selaras `src/lib/mb178/local-store-images.ts` & seed:
--   pupuk-maju, rosaura-skin-clinic, raniah-travel, pakan-pei, drg-sona,
--   rocell-gadget, pestisida-mbp, dapurku-seafood
-- =============================================================================
BEGIN;
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
COMMENT ON TABLE public.stores IS 'Entitas toko MB178; satu baris per toko. Slug unik untuk URL / gambar lokal.';
COMMENT ON COLUMN public.stores.id IS 'UUID primary key; direferensikan products, orders, store_memberships.';
COMMENT ON COLUMN public.stores.slug IS 'Identifier stabil di URL dan mapping aset (contoh: /store/pupuk-maju).';
COMMENT ON COLUMN public.stores.name IS 'Nama tampilan toko di UI pelanggan & admin.';
COMMENT ON COLUMN public.stores.profile_image_url IS 'URL gambar profil (Storage publik atau HTTPS); boleh NULL — UI bisa fallback lokal per slug.';
COMMENT ON COLUMN public.stores.address IS 'Alamat teks untuk kartu toko & pengaturan.';
COMMENT ON COLUMN public.stores.whatsapp_link IS 'Tautan wa.me atau URL WhatsApp bisnis.';
COMMENT ON COLUMN public.stores.phone IS 'Nomor kontak tampilan (teks).';
COMMENT ON COLUMN public.stores.lat IS 'Lintang (WGS84) untuk peta pengaturan toko.';
COMMENT ON COLUMN public.stores.lng IS 'Bujur (WGS84) untuk peta pengaturan toko.';
COMMENT ON COLUMN public.stores.average_rating IS 'Rating 0–5 untuk dashboard owner / radar; default 4.50.';
COMMENT ON COLUMN public.stores.hide_zero_stock_from_catalog IS 'Jika true, produk stok 0 disembunyikan dari katalog publik.';
COMMENT ON COLUMN public.stores.created_at IS 'Urutan default daftar toko di beranda (ORDER BY created_at ASC).';
-- Kolom yang mungkin belum ada jika tabel dibuat manual lewat UI (hanya kolom di screenshot):
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS average_rating numeric(3, 2) NOT NULL DEFAULT 4.50;
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS hide_zero_stock_from_catalog boolean NOT NULL DEFAULT false;
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- ---------------------------------------------------------------------------
-- OPSIONAL: perbaiki typo umum dari input manual (jalankan sekali bila perlu)
-- Hanya jalan jika baris sumber ada dan target slug BELUM dipakai baris lain.
-- ---------------------------------------------------------------------------
UPDATE public.stores
SET name = 'Restoran Seafood Dapurku by Chef Hendra'
WHERE slug = 'dapurku-seafood'
  AND name = 'Restoran Seafood Dapurku by Chef Hend';
UPDATE public.stores AS st
SET slug = 'rosaura-skin-clinic',
  name = 'Rosaura Skin Clinic'
WHERE st.slug = 'rossura-skin-clinic'
  AND NOT EXISTS (
    SELECT 1
    FROM public.stores s2
    WHERE s2.slug = 'rosaura-skin-clinic'
  );
UPDATE public.stores AS st
SET slug = 'pakan-pei',
  name = 'Pakan PE''I Maju Bersama'
WHERE st.slug = 'pakan-pali'
  AND NOT EXISTS (
    SELECT 1
    FROM public.stores s2
    WHERE s2.slug = 'pakan-pei'
  );
COMMIT;