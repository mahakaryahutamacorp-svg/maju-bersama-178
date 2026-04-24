-- =============================================================================
-- Storage: bucket mb178_assets + kebijakan akses
-- =============================================================================
-- Jalankan di Supabase → SQL Editor (sekali per project).
--
-- Path unggahan aplikasi: stores/{slug}/products/{timestamp}-{file}
-- Bucket publik: URL gambar bisa dibaca pelanggan (anon).
-- Tulis unggahan: dari server dengan SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- =============================================================================
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
  )
VALUES (
    'mb178_assets',
    'mb178_assets',
    true,
    5242880,
    ARRAY ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text []
  ) ON CONFLICT (id) DO
UPDATE
SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
-- Baca publik (katalog / gambar produk)
DROP POLICY IF EXISTS "mb178_assets_public_read" ON storage.objects;
CREATE POLICY "mb178_assets_public_read" ON storage.objects FOR
SELECT USING (bucket_id = 'mb178_assets');
-- Blokir tulis dari anon/authenticated langsung (unggah hanya lewat API server + service role)
DROP POLICY IF EXISTS "mb178_assets_no_client_insert" ON storage.objects;
CREATE POLICY "mb178_assets_no_client_insert" ON storage.objects FOR
INSERT TO anon,
  authenticated WITH CHECK (false);
DROP POLICY IF EXISTS "mb178_assets_no_client_update" ON storage.objects;
CREATE POLICY "mb178_assets_no_client_update" ON storage.objects FOR
UPDATE TO anon,
  authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "mb178_assets_no_client_delete" ON storage.objects;
CREATE POLICY "mb178_assets_no_client_delete" ON storage.objects FOR DELETE TO anon,
authenticated USING (false);