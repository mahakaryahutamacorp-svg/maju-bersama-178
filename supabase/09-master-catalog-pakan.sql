-- =============================================================================
-- Maju Bersama 178 — Master Catalog Pakan Ternak (Pakan PE'I Maju Bersama)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.master_catalog_pakan (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  sub_category        text,
  brand_name          text NOT NULL,
  product_name        text NOT NULL,
  composition         text NOT NULL,
  description         text NOT NULL,
  default_unit        text NOT NULL DEFAULT 'kg',
  suggested_price_min numeric(14,2),
  suggested_price_max numeric(14,2),
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_pakan_unique UNIQUE (brand_name, product_name)
);

COMMENT ON TABLE public.master_catalog_pakan IS
  'Katalog referensi pakan ternak untuk toko Pakan PE''I Maju Bersama.';

CREATE INDEX IF NOT EXISTS idx_cat_pakan_category ON public.master_catalog_pakan(category);
CREATE INDEX IF NOT EXISTS idx_cat_pakan_brand ON public.master_catalog_pakan(brand_name);

ALTER TABLE public.master_catalog_pakan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_pakan_select" ON public.master_catalog_pakan
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_pakan_block_insert" ON public.master_catalog_pakan
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "cat_pakan_block_update" ON public.master_catalog_pakan
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "cat_pakan_block_delete" ON public.master_catalog_pakan
  FOR DELETE TO anon, authenticated USING (false);

GRANT SELECT ON public.master_catalog_pakan TO anon, authenticated;
GRANT ALL ON public.master_catalog_pakan TO service_role;

-- Seed Data
INSERT INTO public.master_catalog_pakan (
  category, sub_category, brand_name, product_name,
  composition, description, default_unit,
  suggested_price_min, suggested_price_max
) VALUES
(
  'Pakan Ayam', 'Starter (0-4 minggu)',
  'PT Charoen Pokphand Indonesia', 'CP 511B Broiler Starter Crumble',
  'Protein min 22%, Lemak min 5%, Serat maks 4%, Abu maks 7%, Kadar Air maks 13%, Kalsium 0.9-1.1%, Fosfor 0.7%',
  'Pakan ayam broiler fase starter (DOC hingga 4 minggu) bentuk crumble halus yang mudah dikonsumsi anak ayam. '
  || 'Formulasi tinggi protein untuk pertumbuhan tulang, otot, dan bulu optimal di fase awal. '
  || 'Mengandung coccidiostat untuk pencegahan penyakit koksidiosis. Kemasan: 50 kg/sak.',
  'kg', 8500.00, 9500.00
),
(
  'Pakan Ayam', 'Grower-Finisher (4-panen)',
  'PT Charoen Pokphand Indonesia', 'CP 512B Broiler Finisher Pellet',
  'Protein min 19%, Lemak min 5%, Serat maks 5%, Abu maks 7%, Kadar Air maks 13%, Energi Metabolis 3100 kkal/kg',
  'Pakan ayam broiler fase finisher bentuk pellet untuk mempercepat penambahan bobot badan menjelang panen. '
  || 'Energi metabolis tinggi untuk konversi pakan optimal (FCR 1.5-1.7). '
  || 'Panen ideal: umur 30-35 hari dengan bobot 1.8-2.2 kg. Kemasan: 50 kg/sak.',
  'kg', 8200.00, 9200.00
),
(
  'Pakan Ayam', 'Layer (Petelur)',
  'PT Japfa Comfeed Indonesia', 'Comfeed SL-Layer',
  'Protein min 17%, Lemak min 3%, Serat maks 7%, Kalsium 3.5-4.0%, Fosfor 0.6%, Kadar Air maks 13%',
  'Pakan ayam petelur (layer) untuk menjaga produksi telur optimal (HDP 80-90%). '
  || 'Kalsium tinggi untuk pembentukan cangkang telur yang kuat dan tebal. '
  || 'Digunakan sejak ayam mulai bertelur (umur 18 minggu) hingga afkir. Kemasan: 50 kg/sak.',
  'kg', 7500.00, 8500.00
),
(
  'Pakan Ikan', 'Lele',
  'PT Central Proteina Prima (CP Prima)', 'Hi-Pro-Vite 781-2 Lele',
  'Protein min 31%, Lemak min 5%, Serat maks 6%, Abu maks 13%, Kadar Air maks 12%',
  'Pakan ikan lele fase pembesaran berbentuk pellet apung (floating). '
  || 'Protein 31% dari tepung ikan dan bungkil kedelai untuk pertumbuhan cepat. '
  || 'Pellet apung memudahkan pengamatan nafsu makan ikan. '
  || 'Target panen: 8-10 ekor/kg dalam 2.5-3 bulan. Kemasan: 30 kg/sak.',
  'kg', 11000.00, 13000.00
),
(
  'Pakan Ikan', 'Nila',
  'PT Matahari Sakti', 'MS Prina Nila Grower',
  'Protein min 28%, Lemak min 4%, Serat maks 8%, Kadar Air maks 12%',
  'Pakan ikan nila fase pembesaran untuk menghasilkan pertumbuhan yang seimbang dan efisien. '
  || 'Formulasi khusus ikan nila dengan protein 28% dan asam amino esensial. '
  || 'Cocok untuk budidaya nila di kolam terpal, kolam tanah, dan keramba. Kemasan: 30 kg/sak.',
  'kg', 9500.00, 11500.00
),
(
  'Pakan Sapi', 'Konsentrat',
  'PT Japfa Comfeed Indonesia', 'Comfeed KBS Sapi Potong',
  'Protein min 14%, Lemak min 3%, Serat maks 18%, TDN min 65%, Kalsium 0.6-1.0%, Fosfor 0.5%',
  'Konsentrat sapi potong untuk mempercepat penggemukan (feedlot). '
  || 'Dicampur dengan rumput gajah atau jerami fermentasi (rasio 40:60). '
  || 'Target ADG (Average Daily Gain): 0.8-1.2 kg/hari. Kemasan: 50 kg/sak.',
  'kg', 5500.00, 7000.00
),
(
  'Suplemen', 'Vitamin & Mineral',
  'Medion', 'Vita Chicks / Vitamix',
  'Vitamin A, D3, E, K3, B1, B2, B6, B12, Niacinamide, Ca-Pantothenate, Mangan, Zink, Besi',
  'Suplemen vitamin dan mineral lengkap untuk ayam dan unggas. '
  || 'Diberikan melalui air minum untuk mencegah stress, meningkatkan daya tahan tubuh, '
  || 'dan mempercepat pemulihan pasca-vaksinasi. Dosis: 1 gram per liter air minum.',
  'sachet', 5000.00, 10000.00
),
(
  'Suplemen', 'Probiotik',
  'PT Natural Nusantara (NASA)', 'Viterna Plus',
  'Lactobacillus sp., Saccharomyces sp., mineral organik (Zn, Fe, Cu, Mn), vitamin A, D, E',
  'Suplemen organik NASA untuk meningkatkan konversi pakan, mempercepat pertumbuhan, '
  || 'dan mengurangi bau kandang. Dicampur air minum atau disemprotkan ke pakan. '
  || 'Dosis: 5-10 ml per liter air minum. Cocok untuk ayam, bebek, dan ikan.',
  'botol', 65000.00, 85000.00
)

ON CONFLICT (brand_name, product_name) DO NOTHING;
