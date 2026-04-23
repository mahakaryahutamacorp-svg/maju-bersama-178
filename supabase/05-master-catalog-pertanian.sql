-- =============================================================================
-- Maju Bersama 178 — Tabel Master Catalog Pertanian
-- =============================================================================
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Tabel ini berfungsi sebagai KATALOG REFERENSI produk pertanian.
-- Owner toko cukup pilih dari katalog ini, tidak perlu mengetik manual.
-- =============================================================================

-- ============================================================
-- 1) Buat Tabel master_catalog_pertanian
-- ============================================================

CREATE TABLE IF NOT EXISTS public.master_catalog_pertanian (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL,                          -- 'Herbisida', 'Insektisida', 'Fungisida', 'Pupuk', 'ZPT', dll
  sub_category  text,                                   -- 'Pupuk Makro', 'Pupuk Mikro', 'Herbisida Sistemik', dll
  brand_name    text NOT NULL,                          -- Nama merek / pabrikan (Syngenta, Bayer, Petrokimia Gresik)
  product_name  text NOT NULL,                          -- Nama produk (Roundup 486 SL, Gramoxone 276 SL)
  active_ingredients text NOT NULL,                     -- Bahan aktif + konsentrasi
  formulation   text,                                   -- SL, EC, WP, WG, SP, granul, dll
  description   text NOT NULL,                          -- Deskripsi teknis lengkap (kegunaan, cara pakai, dosis)
  default_unit  text NOT NULL DEFAULT 'liter',          -- Satuan jual default (liter, kg, sachet, botol)
  suggested_price_min numeric(14,2),                    -- Harga pasaran minimum (opsional)
  suggested_price_max numeric(14,2),                    -- Harga pasaran maksimum (opsional)
  image_url     text,                                   -- URL gambar produk (opsional)
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_pertanian_unique_product UNIQUE (brand_name, product_name)
);

COMMENT ON TABLE public.master_catalog_pertanian IS
  'Katalog referensi produk pertanian (pupuk & pestisida). Owner toko pilih dari sini untuk isi etalase.';

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_master_catalog_category ON public.master_catalog_pertanian(category);
CREATE INDEX IF NOT EXISTS idx_master_catalog_brand    ON public.master_catalog_pertanian(brand_name);
CREATE INDEX IF NOT EXISTS idx_master_catalog_search   ON public.master_catalog_pertanian
  USING gin (to_tsvector('indonesian', product_name || ' ' || brand_name || ' ' || active_ingredients));

-- RLS: katalog bisa dibaca semua orang, tulis hanya via service_role
ALTER TABLE public.master_catalog_pertanian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_catalog_select_all"
  ON public.master_catalog_pertanian FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "master_catalog_block_insert"
  ON public.master_catalog_pertanian FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "master_catalog_block_update"
  ON public.master_catalog_pertanian FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "master_catalog_block_delete"
  ON public.master_catalog_pertanian FOR DELETE
  TO anon, authenticated
  USING (false);

-- Grants
GRANT SELECT ON public.master_catalog_pertanian TO anon, authenticated;
GRANT ALL    ON public.master_catalog_pertanian TO service_role;
