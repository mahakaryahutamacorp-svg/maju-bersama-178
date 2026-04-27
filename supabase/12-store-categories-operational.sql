-- =============================================================================
-- Maju Bersama 178 — Kategori toko + status operasional + deskripsi singkat
-- =============================================================================
-- Jalankan di Supabase Dashboard → SQL Editor (database yang sudah berjalan).
-- Idempotent: aman dijalankan lebih dari sekali.
-- Bergantung pada: public.stores, public.store_memberships, public.store_role,
--                   public.has_store_role() (dari 01-setup-database.sql).
-- =============================================================================
-- ---------------------------------------------------------------------------
-- 1) Tabel store_categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT store_categories_name_unique UNIQUE (name),
    CONSTRAINT store_categories_slug_unique UNIQUE (slug)
);
COMMENT ON TABLE public.store_categories IS 'Kategori etalase toko (referensi); dibaca publik, diubah via service role / admin.';
COMMENT ON COLUMN public.store_categories.slug IS 'Slug stabil untuk filter URL & kode aplikasi.';
CREATE INDEX IF NOT EXISTS store_categories_slug_idx ON public.store_categories (slug);
-- ---------------------------------------------------------------------------
-- 2) Seed kategori awal
-- ---------------------------------------------------------------------------
INSERT INTO public.store_categories (name, slug)
VALUES ('Pertanian & Peternakan', 'pertanian-peternakan'),
    ('Klinik & Kesehatan', 'klinik-kesehatan'),
    ('Elektronik & Gadget', 'elektronik-gadget'),
    ('Layanan Jasa', 'layanan-jasa'),
    ('Kuliner', 'kuliner') ON CONFLICT (slug) DO NOTHING;
-- ---------------------------------------------------------------------------
-- 3) Kolom baru pada public.stores
-- ---------------------------------------------------------------------------
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'category_id'
) THEN
ALTER TABLE public.stores
ADD COLUMN category_id uuid REFERENCES public.store_categories (id) ON DELETE
SET NULL;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'is_open'
) THEN
ALTER TABLE public.stores
ADD COLUMN is_open boolean NOT NULL DEFAULT true;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'short_description'
) THEN
ALTER TABLE public.stores
ADD COLUMN short_description varchar(150);
END IF;
END $$;
COMMENT ON COLUMN public.stores.category_id IS 'FK ke store_categories; NULL jika belum diklasifikasi.';
COMMENT ON COLUMN public.stores.is_open IS 'Status operasional toko (tampilan katalog).';
COMMENT ON COLUMN public.stores.short_description IS 'Deskripsi singkat toko, maks. 150 karakter.';
CREATE INDEX IF NOT EXISTS stores_category_id_idx ON public.stores (category_id);
-- ---------------------------------------------------------------------------
-- 4) RLS — store_categories (baca publik)
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store_categories_read_all" ON public.store_categories;
CREATE POLICY "store_categories_read_all" ON public.store_categories FOR
SELECT USING (true);
-- Izin tabel (selaras skrip master: anon + authenticated biasanya sudah punya default grants)
GRANT SELECT ON public.store_categories TO anon,
    authenticated;
-- ---------------------------------------------------------------------------
-- 5) RLS — stores: pemilik / super_admin untuk UPDATE baris toko mereka
-- ---------------------------------------------------------------------------
-- Catatan: SELECT publik "stores_read_all" dari skrip awal tetap berlaku; kolom baru
-- ikut terbaca tanpa mengubah policy SELECT.
DROP POLICY IF EXISTS "stores_owner_or_super_admin_update" ON public.stores;
CREATE POLICY "stores_owner_or_super_admin_update" ON public.stores FOR
UPDATE TO authenticated USING (
        public.has_store_role(
            id,
            ARRAY ['owner', 'super_admin']::public.store_role []
        )
    ) WITH CHECK (
        public.has_store_role(
            id,
            ARRAY ['owner', 'super_admin']::public.store_role []
        )
    );
-- Opsional ketat: hanya service_role yang boleh INSERT/DELETE toko (biasanya seed / admin panel).
-- Jika Anda perlu INSERT dari klien, tambahkan policy terpisah.
-- ---------------------------------------------------------------------------
-- 6) (Opsional) Trigger: batasi panjang short_description di level DB
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stores_short_description_enforce() RETURNS trigger LANGUAGE plpgsql
SET search_path = public AS $$ BEGIN IF NEW.short_description IS NOT NULL
    AND char_length(NEW.short_description) > 150 THEN RAISE EXCEPTION 'short_description maksimal 150 karakter';
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS stores_short_description_enforce_trg ON public.stores;
CREATE TRIGGER stores_short_description_enforce_trg BEFORE
INSERT
    OR
UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.stores_short_description_enforce();