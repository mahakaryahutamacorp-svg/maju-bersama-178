-- =============================================================================
-- Maju Bersama 178 — Master Catalog F&B (Restoran Seafood Dapurku)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.master_catalog_fnb (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  sub_category        text,
  menu_name           text NOT NULL,
  description         text NOT NULL,
  default_unit        text NOT NULL DEFAULT 'porsi',
  suggested_price_min numeric(14,2),
  suggested_price_max numeric(14,2),
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_fnb_unique UNIQUE (category, menu_name)
);

COMMENT ON TABLE public.master_catalog_fnb IS
  'Katalog referensi menu untuk Restoran Seafood Dapurku by Chef Hendra.';

CREATE INDEX IF NOT EXISTS idx_cat_fnb_category ON public.master_catalog_fnb(category);

ALTER TABLE public.master_catalog_fnb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_fnb_select" ON public.master_catalog_fnb
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_fnb_block_insert" ON public.master_catalog_fnb
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "cat_fnb_block_update" ON public.master_catalog_fnb
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "cat_fnb_block_delete" ON public.master_catalog_fnb
  FOR DELETE TO anon, authenticated USING (false);

GRANT SELECT ON public.master_catalog_fnb TO anon, authenticated;
GRANT ALL ON public.master_catalog_fnb TO service_role;

-- Seed Data
INSERT INTO public.master_catalog_fnb (
  category, sub_category, menu_name,
  description, default_unit, suggested_price_min, suggested_price_max
) VALUES
(
  'Seafood', 'Kepiting',
  'Kepiting Saus Padang',
  'Kepiting segar dimasak dengan saus Padang khas Chef Hendra — pedas, gurih, dan creamy. '
  || 'Disajikan per ekor (±500 gram) dengan lalapan dan sambal. Bumbu: cabai merah, bawang, tomat, santan, telur.',
  'porsi', 85000.00, 120000.00
),
(
  'Seafood', 'Kepiting',
  'Kepiting Saus Tiram Telur Asin',
  'Kepiting segar digoreng tepung lalu disiram saus tiram telur asin yang gurih dan creamy. '
  || 'Perpaduan rasa asin, manis, dan umami. Favorit pelanggan. Disajikan per ekor (±500 gram).',
  'porsi', 90000.00, 130000.00
),
(
  'Seafood', 'Udang',
  'Udang Bakar Madu',
  'Udang windu segar ukuran jumbo dibakar dengan olesan madu, mentega, dan bawang putih. '
  || 'Disajikan di atas hot plate dengan sayuran panggang. Porsi: 250 gram (±8 ekor udang).',
  'porsi', 65000.00, 85000.00
),
(
  'Seafood', 'Ikan',
  'Ikan Gurame Bakar Rica-Rica',
  'Ikan gurame segar ukuran 800g-1kg dibakar dengan bumbu rica-rica Manado yang pedas dan aromatik. '
  || 'Disajikan dengan lalapan lengkap, sambal dabu-dabu, dan nasi putih.',
  'porsi', 75000.00, 100000.00
),
(
  'Seafood', 'Cumi',
  'Cumi Goreng Tepung Saus Asam Manis',
  'Cumi segar dipotong ring, digoreng tepung crispy, lalu disiram saus asam manis homemade. '
  || 'Tekstur luar renyah, dalam lembut. Cocok untuk appetizer atau sharing. Porsi: 200 gram.',
  'porsi', 45000.00, 60000.00
),
(
  'Nasi & Rice Bowl', 'Nasi Goreng',
  'Nasi Goreng Seafood Spesial Chef Hendra',
  'Nasi goreng dengan campuran udang, cumi, dan daging kepiting. '
  || 'Dimasak dengan api besar (wok hei) menggunakan kecap ikan dan saus tiram premium. '
  || 'Topping: telur mata sapi, kerupuk udang, dan acar timun.',
  'porsi', 35000.00, 50000.00
),
(
  'Sayur & Pendamping', 'Sayuran',
  'Kangkung Hotplate Belacan',
  'Kangkung segar ditumis dengan belacan (terasi udang), cabai, dan bawang putih. '
  || 'Disajikan di atas hotplate panas yang mendesis. Pedas, gurih, dan menggugah selera.',
  'porsi', 25000.00, 35000.00
),
(
  'Minuman', 'Jus Segar',
  'Es Kelapa Jeruk Nipis',
  'Air kelapa muda segar dicampur perasan jeruk nipis dan madu. Menyegarkan dan sehat. '
  || 'Disajikan dengan daging kelapa muda. Minuman signature Dapurku.',
  'gelas', 15000.00, 22000.00
),
(
  'Paket Hemat', 'Paket Keluarga',
  'Paket Seafood Keluarga (4-6 orang)',
  'Paket lengkap untuk keluarga berisi: 1 ekor kepiting saus Padang, 1 porsi udang bakar madu, '
  || '1 ikan gurame bakar, 1 cumi goreng tepung, 2 sayur (kangkung + capcay), nasi putih 6 porsi, '
  || 'dan 6 es teh manis. Hemat hingga 20% dibanding pesan satuan.',
  'paket', 350000.00, 450000.00
),
(
  'Paket Hemat', 'Paket Berdua',
  'Paket Romantis Seafood (2 orang)',
  'Paket makan berdua: 1 porsi udang bakar madu, 1 cumi goreng tepung, 1 ikan nila goreng, '
  || '1 sayur kangkung, nasi putih 2 porsi, dan 2 minuman pilihan (es teh/jus). '
  || 'Cocok untuk date night atau makan berdua yang spesial.',
  'paket', 150000.00, 200000.00
)

ON CONFLICT (category, menu_name) DO NOTHING;
