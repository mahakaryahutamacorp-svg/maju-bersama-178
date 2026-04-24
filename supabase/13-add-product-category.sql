-- Menambahkan kolom category ke tabel products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;

-- Index untuk pencarian kategori lebih cepat
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);

COMMENT ON COLUMN public.products.category IS 'Kategori produk (opsional), digunakan untuk filtering di katalog.';
