-- Jalankan SEKALI di SQL Editor jika proyek sudah punya `public` lain dari setup lama
-- dan tabel `banners` belum ada (tanpa DROP schema public).
-- Setelah itu: isi baris lewat Table Editor atau service role.
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,
  INSERT,
  UPDATE,
  DELETE ON public.banners TO anon,
  authenticated,
  service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "banners_select_active" ON public.banners;
DROP POLICY IF EXISTS "banners_block_insert" ON public.banners;
DROP POLICY IF EXISTS "banners_block_update" ON public.banners;
DROP POLICY IF EXISTS "banners_block_delete" ON public.banners;
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