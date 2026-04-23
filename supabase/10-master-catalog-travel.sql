-- =============================================================================
-- Maju Bersama 178 — Master Catalog Travel (Raniah Travel Umroh dan Haji)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.master_catalog_travel (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  sub_category        text,
  package_name        text NOT NULL,
  duration            text,
  description         text NOT NULL,
  default_unit        text NOT NULL DEFAULT 'paket',
  suggested_price_min numeric(14,2),
  suggested_price_max numeric(14,2),
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_travel_unique UNIQUE (category, package_name)
);

COMMENT ON TABLE public.master_catalog_travel IS
  'Katalog referensi paket perjalanan untuk Raniah Travel Umroh dan Haji.';

CREATE INDEX IF NOT EXISTS idx_cat_travel_category ON public.master_catalog_travel(category);

ALTER TABLE public.master_catalog_travel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_travel_select" ON public.master_catalog_travel
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_travel_block_insert" ON public.master_catalog_travel
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "cat_travel_block_update" ON public.master_catalog_travel
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "cat_travel_block_delete" ON public.master_catalog_travel
  FOR DELETE TO anon, authenticated USING (false);

GRANT SELECT ON public.master_catalog_travel TO anon, authenticated;
GRANT ALL ON public.master_catalog_travel TO service_role;

-- Seed Data
INSERT INTO public.master_catalog_travel (
  category, sub_category, package_name, duration,
  description, default_unit, suggested_price_min, suggested_price_max
) VALUES
(
  'Umroh', 'Reguler',
  'Umroh Reguler 9 Hari', '9 Hari 8 Malam',
  'Paket umroh reguler dengan jadwal keberangkatan terjadwal setiap bulan. '
  || 'Penerbangan langsung Jakarta-Jeddah PP (Saudia/Garuda). '
  || 'Hotel bintang 3 di Makkah (500m dari Masjidil Haram) dan Madinah (300m dari Masjid Nabawi). '
  || 'Termasuk: visa umroh, akomodasi, makan 3x/hari (catering Indonesia), transportasi AC, '
  || 'muthawwif berpengalaman, ziarah kota Makkah dan Madinah, air zamzam 5 liter.',
  'paket/orang', 25000000.00, 32000000.00
),
(
  'Umroh', 'VIP',
  'Umroh VIP Plus 9 Hari', '9 Hari 8 Malam',
  'Paket umroh VIP dengan fasilitas premium dan grup kecil (maks 15 jamaah). '
  || 'Penerbangan Garuda Indonesia langsung. Hotel bintang 5 walking distance ke Masjidil Haram dan Masjid Nabawi. '
  || 'Termasuk: city tour Jeddah, handling VIP bandara, koper kabin, perlengkapan ibadah premium, '
  || 'makan buffet hotel bintang 5, dan private muthawwif.',
  'paket/orang', 38000000.00, 50000000.00
),
(
  'Umroh', 'Ramadhan',
  'Umroh Ramadhan 14 Hari', '14 Hari 13 Malam',
  'Paket khusus ibadah umroh di bulan Ramadhan dengan durasi lebih panjang. '
  || 'Merasakan 10 hari terakhir Ramadhan di Tanah Suci. '
  || 'Hotel dekat Masjidil Haram untuk memudahkan shalat Tarawih dan Tahajud. '
  || 'Termasuk: sahur dan buka puasa di hotel, ziarah lengkap, dan air zamzam.',
  'paket/orang', 35000000.00, 48000000.00
),
(
  'Haji', 'Haji Furoda',
  'Haji Plus / Furoda', '26 Hari 25 Malam',
  'Program haji tanpa antrian panjang melalui jalur visa furoda (non-kuota). '
  || 'Keberangkatan terjamin sesuai jadwal yang dipilih. '
  || 'Hotel bintang 5 dekat Masjidil Haram. Penerbangan Garuda/Saudia langsung. '
  || 'Termasuk: manasik haji intensif 3 hari, perlengkapan haji lengkap, '
  || 'dam/fidyah, makan full board, dan kurban (opsional).',
  'paket/orang', 120000000.00, 180000000.00
),
(
  'Wisata Religi', 'Turki',
  'Wisata Religi Turki + Umroh 12 Hari', '12 Hari 11 Malam',
  'Paket kombinasi wisata religi Turki (Istanbul, Cappadocia, Bursa) dilanjutkan umroh di Makkah dan Madinah. '
  || 'Istanbul: Hagia Sophia, Blue Mosque, Grand Bazaar, Topkapi Palace. '
  || 'Cappadocia: opsional balon udara (biaya sendiri). Bursa: Masjid Hijau dan wisata alam. '
  || 'Kemudian terbang ke Jeddah untuk umroh 4 hari. '
  || 'Termasuk: penerbangan internasional, visa Turki + umroh, hotel bintang 4, dan guide lokal.',
  'paket/orang', 42000000.00, 55000000.00
),
(
  'Wisata Religi', 'Aqsa',
  'Wisata Al-Aqsa Palestina + Yordania 10 Hari', '10 Hari 9 Malam',
  'Perjalanan spiritual ke Masjid Al-Aqsa (Yerusalem), Dome of the Rock, dan tempat-tempat bersejarah Islam. '
  || 'Yordania: Petra (Keajaiban Dunia), Laut Mati, Gunung Nebo, dan Kota Amman. '
  || 'Masuk melalui perbatasan Yordania-Palestina (King Hussein Bridge). '
  || 'Termasuk: penerbangan Jakarta-Amman PP, visa, akomodasi hotel bintang 4, makan 3x/hari, dan guide Muslim.',
  'paket/orang', 38000000.00, 52000000.00
)

ON CONFLICT (category, package_name) DO NOTHING;
