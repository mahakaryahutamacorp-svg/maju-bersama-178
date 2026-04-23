-- =============================================================================
-- Maju Bersama 178 — Master Catalog Medis / Dental (Klinik drg. Sona)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.master_catalog_medis (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  sub_category        text,
  service_code        text,
  service_name        text NOT NULL,
  description         text NOT NULL,
  default_unit        text NOT NULL DEFAULT 'tindakan',
  suggested_price_min numeric(14,2),
  suggested_price_max numeric(14,2),
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_medis_unique UNIQUE (category, service_name)
);

COMMENT ON TABLE public.master_catalog_medis IS
  'Katalog referensi layanan klinik gigi untuk Klinik drg. Sona.';

CREATE INDEX IF NOT EXISTS idx_cat_medis_category ON public.master_catalog_medis(category);

ALTER TABLE public.master_catalog_medis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_medis_select" ON public.master_catalog_medis
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_medis_block_insert" ON public.master_catalog_medis
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "cat_medis_block_update" ON public.master_catalog_medis
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "cat_medis_block_delete" ON public.master_catalog_medis
  FOR DELETE TO anon, authenticated USING (false);

GRANT SELECT ON public.master_catalog_medis TO anon, authenticated;
GRANT ALL ON public.master_catalog_medis TO service_role;

-- Seed Data
INSERT INTO public.master_catalog_medis (
  category, sub_category, service_code, service_name,
  description, default_unit, suggested_price_min, suggested_price_max
) VALUES
(
  'Perawatan Umum', 'Pemeriksaan',
  'DEN-001', 'Konsultasi & Pemeriksaan Gigi',
  'Pemeriksaan menyeluruh kondisi gigi, gusi, dan rongga mulut. '
  || 'Termasuk konsultasi rencana perawatan dan edukasi kesehatan gigi. Durasi: 15-30 menit.',
  'tindakan', 50000.00, 100000.00
),
(
  'Perawatan Umum', 'Pembersihan',
  'DEN-002', 'Scaling / Pembersihan Karang Gigi',
  'Pembersihan karang gigi (kalkulus) menggunakan ultrasonic scaler. '
  || 'Menghilangkan plak dan karang gigi yang menyebabkan bau mulut, gusi berdarah, dan penyakit periodontal. '
  || 'Direkomendasikan setiap 6 bulan sekali. Durasi: 30-45 menit.',
  'tindakan', 150000.00, 350000.00
),
(
  'Perawatan Umum', 'Penambalan',
  'DEN-003', 'Tambal Gigi Komposit (Resin)',
  'Penambalan gigi berlubang menggunakan material resin komposit sewarna gigi. '
  || 'Estetis dan tahan lama (3-7 tahun). Cocok untuk gigi depan dan belakang. '
  || 'Proses: pembersihan karies, bonding, aplikasi komposit lapis demi lapis, curing LED, dan polishing.',
  'tindakan', 150000.00, 400000.00
),
(
  'Bedah Mulut', 'Ekstraksi',
  'DEN-004', 'Cabut Gigi Biasa',
  'Pencabutan gigi yang sudah tidak bisa dirawat (karies besar, gigi goyang, dll). '
  || 'Dilakukan dengan anestesi lokal. Termasuk obat pasca-cabut (antibiotik dan anti-nyeri). '
  || 'Waktu penyembuhan: 3-7 hari.',
  'tindakan', 150000.00, 300000.00
),
(
  'Bedah Mulut', 'Ekstraksi',
  'DEN-005', 'Cabut Gigi Bungsu (Odontektomi)',
  'Pencabutan gigi bungsu impaksi yang tumbuh miring atau terpendam dalam tulang rahang. '
  || 'Memerlukan tindakan bedah minor: insisi gusi, pengambilan tulang, dan penjahitan. '
  || 'Anestesi lokal. Waktu penyembuhan: 7-14 hari. Kontrol jahitan setelah 1 minggu.',
  'tindakan', 1000000.00, 2500000.00
),
(
  'Estetika Gigi', 'Bleaching',
  'DEN-006', 'Bleaching Gigi (In-Office)',
  'Pemutihan gigi di klinik menggunakan gel Hidrogen Peroksida 35-40% dengan aktivasi sinar LED/laser. '
  || 'Hasil langsung terlihat: gigi 3-8 shade lebih putih dalam 1 sesi. '
  || 'Cocok untuk gigi kuning akibat kopi, teh, atau rokok. Durasi: 60-90 menit.',
  'tindakan', 1500000.00, 3000000.00
),
(
  'Estetika Gigi', 'Veneer',
  'DEN-007', 'Veneer Porselen (per gigi)',
  'Pelapisan permukaan gigi dengan cangkang porselen tipis untuk memperbaiki bentuk, ukuran, dan warna gigi. '
  || 'Hasil natural dan tahan 10-15 tahun. Proses: preparasi gigi, cetak, dan pemasangan veneer custom-made. '
  || 'Memerlukan 2 kali kunjungan. Harga per gigi.',
  'tindakan', 2500000.00, 5000000.00
),
(
  'Orthodonti', 'Kawat Gigi',
  'DEN-008', 'Pasang Behel / Kawat Gigi Konvensional',
  'Pemasangan bracket dan kawat ortodontik untuk merapikan susunan gigi. '
  || 'Termasuk konsultasi, foto rontgen panoramik, cetak gigi, dan pemasangan. '
  || 'Kontrol bulanan selama 1-2 tahun. Harga belum termasuk biaya kontrol bulanan.',
  'tindakan', 5000000.00, 10000000.00
),
(
  'Prosthodonti', 'Gigi Tiruan',
  'DEN-009', 'Crown / Mahkota Gigi Porselen',
  'Pemasangan mahkota gigi tiruan dari bahan porselen untuk gigi yang rusak parah atau pasca-perawatan saluran akar. '
  || 'Custom-made di laboratorium dental. Warna disesuaikan dengan gigi asli. '
  || 'Tahan 10-15 tahun dengan perawatan baik. Memerlukan 2-3 kunjungan.',
  'tindakan', 2000000.00, 5000000.00
),
(
  'Perawatan Anak', 'Preventif',
  'DEN-010', 'Fluoride Treatment Anak',
  'Aplikasi fluoride topikal pada gigi anak untuk mencegah karies dan memperkuat email gigi. '
  || 'Aman untuk anak usia 3 tahun ke atas. Direkomendasikan setiap 6 bulan bersamaan dengan kontrol rutin. '
  || 'Durasi: 15-20 menit. Anak tidak boleh makan/minum 30 menit setelah aplikasi.',
  'tindakan', 100000.00, 200000.00
)

ON CONFLICT (category, service_name) DO NOTHING;
