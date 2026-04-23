-- =============================================================================
-- Maju Bersama 178 — Master Catalog Estetika (Rosaura Skin Clinic)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.master_catalog_estetika (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  sub_category        text,
  brand_name          text NOT NULL,
  product_name        text NOT NULL,
  ingredients         text,
  description         text NOT NULL,
  default_unit        text NOT NULL DEFAULT 'treatment',
  suggested_price_min numeric(14,2),
  suggested_price_max numeric(14,2),
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_estetika_unique UNIQUE (brand_name, product_name)
);

COMMENT ON TABLE public.master_catalog_estetika IS
  'Katalog referensi layanan & produk kecantikan untuk Rosaura Skin Clinic.';

CREATE INDEX IF NOT EXISTS idx_cat_estetika_category ON public.master_catalog_estetika(category);
CREATE INDEX IF NOT EXISTS idx_cat_estetika_brand ON public.master_catalog_estetika(brand_name);

ALTER TABLE public.master_catalog_estetika ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_estetika_select" ON public.master_catalog_estetika
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_estetika_block_insert" ON public.master_catalog_estetika
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "cat_estetika_block_update" ON public.master_catalog_estetika
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "cat_estetika_block_delete" ON public.master_catalog_estetika
  FOR DELETE TO anon, authenticated USING (false);

GRANT SELECT ON public.master_catalog_estetika TO anon, authenticated;
GRANT ALL ON public.master_catalog_estetika TO service_role;

-- Seed Data
INSERT INTO public.master_catalog_estetika (
  category, sub_category, brand_name, product_name,
  ingredients, description, default_unit,
  suggested_price_min, suggested_price_max
) VALUES

-- === LAYANAN FACIAL ===
(
  'Facial Treatment', 'Deep Cleansing',
  'Rosaura Clinic', 'Hydra Glow Facial',
  'Hyaluronic Acid, Vitamin C, Niacinamide, Aloe Vera Extract',
  'Facial treatment premium untuk membersihkan pori secara mendalam dan mengembalikan kelembapan kulit. '
  || 'Proses meliputi: double cleansing, steam, ekstraksi komedo, masker hyaluronic acid, dan serum Vitamin C. '
  || 'Hasil: kulit glowing, kenyal, dan terhidrasi. Cocok untuk semua jenis kulit. Durasi: 60 menit.',
  'treatment', 250000.00, 350000.00
),
(
  'Facial Treatment', 'Anti-Aging',
  'Rosaura Clinic', 'Gold Collagen Facial',
  'Collagen, Gold Nanoparticles, Retinol, Peptide Complex',
  'Treatment anti-aging premium menggunakan masker gold collagen untuk merangsang produksi kolagen alami. '
  || 'Mengurangi garis halus, mengencangkan kulit, dan memberikan efek lifting instan. '
  || 'Proses: cleansing, micro-massage, gold mask 20 menit, serum retinol, dan moisturizer. Durasi: 75 menit.',
  'treatment', 450000.00, 650000.00
),
(
  'Facial Treatment', 'Acne Care',
  'Rosaura Clinic', 'Acne Clear Intensive Facial',
  'Salicylic Acid 2%, Tea Tree Oil, Zinc PCA, Centella Asiatica',
  'Facial khusus kulit berjerawat untuk mengurangi peradangan, membunuh bakteri P. acnes, dan mengontrol sebum. '
  || 'Proses: cleansing antibakteri, high-frequency therapy, ekstraksi aman, masker salicylic acid, dan calming serum. '
  || 'Direkomendasikan setiap 2 minggu sekali untuk hasil optimal. Durasi: 60 menit.',
  'treatment', 200000.00, 300000.00
),

-- === CHEMICAL PEELING ===
(
  'Chemical Peeling', 'Brightening',
  'Rosaura Clinic', 'Lactic Acid Peel 30%',
  'Lactic Acid 30%, Kojic Acid, Arbutin',
  'Peeling ringan (superficial) menggunakan asam laktat untuk mencerahkan kulit kusam, meratakan warna kulit, '
  || 'dan mengurangi hiperpigmentasi pasca-jerawat. Aman untuk kulit sensitif. '
  || 'Downtime minimal 1-2 hari (kulit terasa kering). Interval: setiap 2-4 minggu. Durasi: 30 menit.',
  'treatment', 350000.00, 500000.00
),

-- === SKINCARE PRODUCT ===
(
  'Skincare', 'Serum',
  'SOMETHINC', 'Niacinamide + Moisture Sabi Beet Serum',
  'Niacinamide 10%, Squalane, Beta Glucan, Centella Asiatica',
  'Serum lokal premium untuk mengontrol minyak, mengecilkan pori, dan mencerahkan kulit. '
  || 'Tekstur ringan water-based, cepat menyerap tanpa rasa lengket. Cocok untuk kulit berminyak dan kombinasi. '
  || 'Pemakaian: 2-3 tetes pada wajah bersih, pagi dan malam.',
  'botol', 89000.00, 129000.00
),
(
  'Skincare', 'Sunscreen',
  'SKINTIFIC', '5X Ceramide Serum Sunscreen SPF50 PA++++',
  'Ceramide NP, Ceramide AP, Ceramide EOP, Phytosphingosine, Cholesterol, Centella Asiatica',
  'Sunscreen hybrid (chemical + physical) dengan 5 jenis ceramide untuk melindungi skin barrier. '
  || 'SPF50 PA++++ melindungi dari UVA dan UVB. Tekstur ringan, tidak white cast, cocok untuk kulit sensitif. '
  || 'Tahan air dan keringat hingga 80 menit. Isi: 30ml.',
  'tube', 79000.00, 109000.00
),
(
  'Skincare', 'Moisturizer',
  'Avoskin', 'Your Skin Bae Panthenol 5% + Mugwort + Cica',
  'Panthenol 5%, Artemisia Vulgaris (Mugwort), Centella Asiatica, Ceramide',
  'Pelembap serbaguna yang menenangkan kulit iritasi, memperkuat skin barrier, dan menghidrasi intensif. '
  || 'Cocok untuk kulit sensitif, post-treatment, dan recovery setelah peeling atau retinol. '
  || 'Tekstur gel-cream ringan, cepat menyerap. Pemakaian: setelah serum, pagi dan malam.',
  'tube', 119000.00, 159000.00
),

-- === BODY TREATMENT ===
(
  'Body Treatment', 'Whitening',
  'Rosaura Clinic', 'Body Whitening Drip Infusion',
  'Glutathione 1200mg, Vitamin C 2000mg, Alpha Lipoic Acid, Collagen',
  'Infus whitening premium untuk mencerahkan kulit dari dalam secara menyeluruh. '
  || 'Glutathione sebagai master antioksidan menghambat produksi melanin. '
  || 'Direkomendasikan 1x seminggu selama 4-8 minggu untuk hasil optimal. '
  || 'Dilakukan oleh dokter/perawat bersertifikat. Durasi: 45-60 menit.',
  'treatment', 500000.00, 850000.00
),
(
  'Body Treatment', 'Slimming',
  'Rosaura Clinic', 'RF Body Contouring',
  'Radiofrequency Energy (1-3 MHz)',
  'Treatment body contouring non-invasif menggunakan teknologi radiofrequency untuk mengencangkan kulit '
  || 'dan mengurangi lemak lokal. Merangsang produksi kolagen dan elastin di dermis. '
  || 'Area treatment: perut, lengan, paha, atau double chin. Per sesi per area. Durasi: 30-45 menit.',
  'treatment', 400000.00, 750000.00
),

-- === HAIR TREATMENT ===
(
  'Hair Treatment', 'Hair Spa',
  'Rosaura Clinic', 'Keratin Hair Spa Premium',
  'Keratin Protein, Argan Oil, Jojoba Oil, Vitamin E',
  'Treatment rambut intensif untuk melembutkan, menutrisi, dan mengembalikan kilau rambut rusak. '
  || 'Cocok untuk rambut kering, bercabang, dan rusak akibat pewarnaan atau styling berlebihan. '
  || 'Proses: shampo, massage scalp, masker keratin 20 menit dengan steamer, dan blow dry. Durasi: 60 menit.',
  'treatment', 150000.00, 250000.00
)

ON CONFLICT (brand_name, product_name) DO NOTHING;
