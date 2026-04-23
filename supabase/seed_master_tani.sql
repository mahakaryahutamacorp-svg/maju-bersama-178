-- =============================================================================
-- Maju Bersama 178 — Seed Data: Produk Pestisida & Pupuk Populer
-- =============================================================================
-- Jalankan SETELAH 05-master-catalog-pertanian.sql
--
-- Berisi 10 produk pestisida & pupuk yang populer di Indonesia,
-- khususnya daerah Belitang, OKU Timur, Sumatera Selatan.
-- Deskripsi sudah lengkap agar owner toko langsung pakai tanpa edit.
-- =============================================================================

INSERT INTO public.master_catalog_pertanian (
  category, sub_category, brand_name, product_name,
  active_ingredients, formulation, description,
  default_unit, suggested_price_min, suggested_price_max
) VALUES

-- ============================================================
-- HERBISIDA (Pembasmi Gulma)
-- ============================================================

(
  'Herbisida',
  'Herbisida Sistemik Pasca-Tumbuh',
  'Monsanto / Bayer',
  'Roundup 486 SL',
  'Isopropilamin glifosat 486 g/l (setara glifosat 356 g/l)',
  'SL (Soluble Liquid / Larutan)',
  'Herbisida sistemik pasca-tumbuh berspektrum luas untuk mengendalikan gulma pada perkebunan kelapa sawit, karet, kakao, kopi, teh, dan lahan non-budidaya. '
  || 'Bekerja dengan cara menghambat enzim EPSPS pada jalur asam shikimat sehingga tanaman gulma mati secara menyeluruh dari daun hingga akar. '
  || 'Dosis: 2–4 liter/ha tergantung jenis gulma. Campurkan 75–150 ml Roundup per tangki semprot 14 liter. '
  || 'Aplikasi: semprot merata pada gulma yang sedang tumbuh aktif (tinggi 15–20 cm). '
  || 'Jangan dicampur dengan herbisida kontak. Interval penyemprotan ulang 2–3 bulan. '
  || 'No. Pendaftaran Kementan RI: RI. 01030120053752.',
  'liter',
  75000.00,
  95000.00
),

(
  'Herbisida',
  'Herbisida Kontak Non-Selektif',
  'Syngenta',
  'Gramoxone 276 SL',
  'Parakuat diklorida 276 g/l',
  'SL (Soluble Liquid / Larutan)',
  'Herbisida kontak non-selektif yang bekerja cepat membakar jaringan gulma dalam 1–3 hari setelah aplikasi. '
  || 'Efektif untuk pengendalian gulma di perkebunan kelapa sawit, karet, sayuran (sebelum tanam), dan lahan non-budidaya. '
  || 'Parakuat bekerja dengan cara merusak membran sel melalui pembentukan radikal bebas pada proses fotosintesis (Fotosistem I). '
  || 'Tidak diserap akar sehingga aman untuk tanaman budidaya asal tidak terkena semprotan langsung. '
  || 'Dosis: 2–3 liter/ha. Campurkan 60–90 ml per tangki 14 liter. '
  || 'Aplikasi pagi atau sore hari saat gulma aktif berfotosintesis. '
  || 'No. Pendaftaran Kementan RI: RI. 01020120022042.',
  'liter',
  65000.00,
  85000.00
),

-- ============================================================
-- INSEKTISIDA (Pembasmi Serangga)
-- ============================================================

(
  'Insektisida',
  'Insektisida Kontak & Lambung',
  'Dow AgroSciences / Corteva',
  'Dursban 200 EC',
  'Klorpirifos 200 g/l',
  'EC (Emulsifiable Concentrate)',
  'Insektisida kontak dan lambung golongan organofosfat untuk mengendalikan hama penggerek batang padi, wereng coklat, ulat grayak, kutu daun, dan semut. '
  || 'Klorpirifos bekerja dengan menghambat enzim asetilkolinesterase sehingga menyebabkan gangguan saraf pada serangga. '
  || 'Cocok untuk tanaman padi, jagung, palawija, sayuran, dan perkebunan. '
  || 'Dosis: 1,5–2 liter/ha untuk padi. Campurkan 30–40 ml per tangki 14 liter. '
  || 'Waktu aplikasi terbaik: pagi/sore hari. Masa tunggu panen (PHI): 21 hari untuk padi. '
  || 'Perhatian: gunakan APD lengkap (masker, sarung tangan, kacamata). '
  || 'No. Pendaftaran Kementan RI: RI. 01010120042392.',
  'liter',
  55000.00,
  75000.00
),

(
  'Insektisida',
  'Insektisida Sistemik',
  'Syngenta',
  'Virtako 300 SC',
  'Klorantraniliprol 100 g/l + Tiametoksam 200 g/l',
  'SC (Suspension Concentrate)',
  'Insektisida sistemik kombinasi dua bahan aktif untuk mengendalikan penggerek batang padi kuning (Scirpophaga incertulas) dan wereng batang cokelat. '
  || 'Klorantraniliprol (golongan Diamide) bekerja pada reseptor Ryanodine otot serangga; Tiametoksam (golongan Neonicotinoid) bekerja pada reseptor asetilkolin saraf serangga. '
  || 'Kombinasi ini memberikan perlindungan ganda dari dalam (sistemik) dan luar (kontak). '
  || 'Dosis: 75–100 ml/ha. Campurkan 1,5–2 ml per tangki 14 liter. '
  || 'Aplikasi pada fase vegetatif awal saat tanaman padi berumur 14–21 HST. '
  || 'PHI: 30 hari. Sangat efektif di daerah persawahan Belitang dan OKU Timur.',
  'botol',
  120000.00,
  160000.00
),

-- ============================================================
-- FUNGISIDA (Pembasmi Jamur)
-- ============================================================

(
  'Fungisida',
  'Fungisida Sistemik & Kontak',
  'Syngenta',
  'Amistartop 325 SC',
  'Azoksistrobin 200 g/l + Difenokonazol 125 g/l',
  'SC (Suspension Concentrate)',
  'Fungisida sistemik dan kontak kombinasi dua bahan aktif untuk mengendalikan penyakit blast (Pyricularia oryzae) dan hawar daun (Helminthosporium oryzae) pada padi. '
  || 'Juga efektif terhadap bercak daun, karat, dan busuk buah pada tanaman hortikultura. '
  || 'Azoksistrobin (Strobilurin) menghambat respirasi mitokondria sel jamur; Difenokonazol (Triazol) menghambat biosintesis ergosterol pada membran sel jamur. '
  || 'Dosis: 0,5–0,75 liter/ha untuk padi. Campurkan 10–15 ml per tangki 14 liter. '
  || 'Aplikasi pada fase generatif (menjelang bunting) untuk perlindungan maksimal. '
  || 'PHI: 14 hari. Aman digunakan sesuai rekomendasi.',
  'botol',
  145000.00,
  185000.00
),

-- ============================================================
-- PUPUK ANORGANIK
-- ============================================================

(
  'Pupuk',
  'Pupuk Makro Tunggal (Nitrogen)',
  'PT Pupuk Sriwidjaja Palembang (Pusri)',
  'Urea Pusri (Pupuk Indonesia)',
  'Nitrogen (N) 46%',
  'Prill / Granul',
  'Pupuk nitrogen tunggal bersubsidi dengan kadar N tertinggi (46%). Berfungsi memacu pertumbuhan vegetatif tanaman: '
  || 'pembentukan batang, daun, dan anakan (pada padi). '
  || 'Produksi PT Pupuk Sriwidjaja Palembang, anak perusahaan Pupuk Indonesia Holding Company. '
  || 'Dosis untuk padi: 200–300 kg/ha/musim, dibagi 2–3 kali pemupukan (7 HST, 21 HST, 35–42 HST). '
  || 'Dosis untuk jagung: 250–350 kg/ha. Dosis untuk sawit: 1–2 kg/pokok/tahun (TBM), 2–3 kg/pokok/tahun (TM). '
  || 'Aplikasi: tebar merata di permukaan sawah (kondisi macak-macak) atau larikan pada tanaman palawija. '
  || 'Simpan di tempat kering, hindari kelembaban tinggi karena mudah menyerap air. '
  || 'HET Subsidi: ±Rp 112.500/50 kg (sesuai Permendag 2024). Warna kemasan: kuning strip merah.',
  'kg',
  2250.00,
  3500.00
),

(
  'Pupuk',
  'Pupuk Makro Majemuk (NPK)',
  'PT Petrokimia Gresik',
  'NPK Phonska 15-15-15',
  'Nitrogen (N) 15% + Fosfat (P₂O₅) 15% + Kalium (K₂O) 15% + Sulfur (S) 10%',
  'Granul',
  'Pupuk majemuk NPK bersubsidi dengan komposisi seimbang 15-15-15 plus Sulfur 10%. '
  || 'Menyediakan tiga unsur hara makro utama secara bersamaan dalam satu butiran granul. '
  || 'Nitrogen untuk pertumbuhan vegetatif, Fosfat untuk perakaran & pembungaan, Kalium untuk ketahanan tanaman & kualitas hasil panen. '
  || 'Cocok untuk padi, jagung, kedelai, sayuran, buah-buahan, dan perkebunan. '
  || 'Dosis untuk padi: 200–300 kg/ha sebagai pupuk dasar saat tanam atau 7 HST. '
  || 'Dosis untuk jagung: 300–350 kg/ha. Aplikasi: tebar merata atau ditugal di samping tanaman. '
  || 'Keunggulan: satu jenis pupuk mencukupi tiga kebutuhan unsur hara, lebih efisien. '
  || 'HET Subsidi: ±Rp 115.000/50 kg (sesuai Permendag 2024). Kemasan: putih strip merah.',
  'kg',
  2300.00,
  4000.00
),

(
  'Pupuk',
  'Pupuk Makro Majemuk Premium',
  'Meroke / PT Kaltim Nitrate Indonesia',
  'NPK Mutiara 16-16-16',
  'Nitrogen (N) 16% + Fosfat (P₂O₅) 16% + Kalium (K₂O) 16%',
  'Granul (Crystal Blue)',
  'Pupuk majemuk NPK non-subsidi berkualitas premium dengan butiran kristal biru khas. '
  || 'Komposisi seimbang 16-16-16 menjadikannya pupuk serbaguna untuk semua jenis tanaman. '
  || 'Keunggulan: butiran seragam sehingga penyebaran merata, larut sempurna di tanah, '
  || 'dan tidak meninggalkan residu yang mengganggu pH tanah. '
  || 'Dosis untuk padi: 150–250 kg/ha. Dosis untuk sawit: 2–3 kg/pokok/tahun. '
  || 'Dosis untuk sayuran: 200–400 kg/ha tergantung jenis tanaman. '
  || 'Bisa diaplikasikan melalui fertigasi (irigasi tetes) karena kelarutannya tinggi. '
  || 'Sangat populer di kalangan petani Belitang untuk tanaman padi dan hortikultura. '
  || 'Harga non-subsidi: ±Rp 350.000–480.000/50 kg.',
  'kg',
  7000.00,
  9600.00
),

(
  'Pupuk',
  'Pupuk Makro Tunggal (Kalium)',
  'PT Petrokimia Gresik',
  'KCl Mahkota (Kalium Klorida)',
  'Kalium (K₂O) 60%',
  'Kristal / Granul merah',
  'Pupuk tunggal kalium dengan kadar K₂O tinggi (60%) untuk meningkatkan kualitas hasil panen. '
  || 'Kalium berperan penting dalam: transportasi asimilat, ketahanan terhadap hama & penyakit, '
  || 'pengaturan stomata, dan peningkatan berat & kualitas gabah/buah. '
  || 'Sangat penting untuk tanaman padi di fase generatif (pembungaan & pengisian bulir). '
  || 'Dosis untuk padi: 50–100 kg/ha pada 35–42 HST bersamaan dengan pemupukan urea ke-3. '
  || 'Dosis untuk sawit: 2–4 kg/pokok/tahun. Dosis untuk karet: 0,5–1 kg/pokok/tahun. '
  || 'Aplikasi: tebar merata atau larikan pada tanaman palawija. '
  || 'Hindari aplikasi bersamaan dengan pupuk fosfat (SP-36) karena bereaksi. '
  || 'Kemasan: 50 kg, warna merah khas.',
  'kg',
  7500.00,
  12000.00
),

(
  'Pupuk',
  'Pupuk Makro Tunggal (Fosfat)',
  'PT Petrokimia Gresik',
  'SP-36 Petrokimia Gresik',
  'Fosfat (P₂O₅) 36% sebagai Super Fosfat',
  'Granul abu-abu',
  'Pupuk tunggal fosfat bersubsidi untuk memperkuat perakaran dan mempercepat pembungaan tanaman. '
  || 'Fosfat merupakan unsur esensial dalam pembentukan ATP, asam nukleat, dan fosfolipid membran sel. '
  || 'Sangat dibutuhkan pada awal tanam dan fase generatif (pembungaan). '
  || 'Dosis untuk padi: 100–150 kg/ha sebagai pupuk dasar (sebelum tanam). '
  || 'Dosis untuk jagung: 100–200 kg/ha. Dosis untuk sayuran: 150–300 kg/ha. '
  || 'Aplikasi: ditebar merata saat pengolahan tanah terakhir atau dicampur dengan pupuk kandang. '
  || 'Keunggulan SP-36 vs TSP: harga lebih terjangkau dan mengandung Sulfur (S) 5% sebagai unsur tambahan. '
  || 'HET Subsidi: ±Rp 105.000/50 kg (sesuai Permendag 2024). Kemasan: abu-abu strip merah.',
  'kg',
  2100.00,
  3500.00
)

ON CONFLICT (brand_name, product_name) DO NOTHING;

-- ============================================================
-- Selesai! 10 produk siap digunakan owner toko.
-- ============================================================
