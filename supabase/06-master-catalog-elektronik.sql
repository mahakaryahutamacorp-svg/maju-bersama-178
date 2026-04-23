-- =============================================================================
-- Maju Bersama 178 — Master Catalog Elektronik (Rocell Gadget)
-- =============================================================================
-- Jalankan SETELAH 00-setup-database.sql
-- =============================================================================

-- 1) DDL
CREATE TABLE IF NOT EXISTS public.master_catalog_elektronik (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            text NOT NULL,
  sub_category        text,
  brand_name          text NOT NULL,
  product_name        text NOT NULL,
  specifications      text NOT NULL,
  description         text NOT NULL,
  default_unit        text NOT NULL DEFAULT 'unit',
  suggested_price_min numeric(14,2),
  suggested_price_max numeric(14,2),
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_catalog_elektronik_unique UNIQUE (brand_name, product_name)
);

COMMENT ON TABLE public.master_catalog_elektronik IS
  'Katalog referensi produk elektronik & gadget untuk toko Rocell Gadget.';

CREATE INDEX IF NOT EXISTS idx_cat_elektronik_category ON public.master_catalog_elektronik(category);
CREATE INDEX IF NOT EXISTS idx_cat_elektronik_brand ON public.master_catalog_elektronik(brand_name);

-- 2) RLS
ALTER TABLE public.master_catalog_elektronik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_elektronik_select" ON public.master_catalog_elektronik
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "cat_elektronik_block_insert" ON public.master_catalog_elektronik
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "cat_elektronik_block_update" ON public.master_catalog_elektronik
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "cat_elektronik_block_delete" ON public.master_catalog_elektronik
  FOR DELETE TO anon, authenticated USING (false);

GRANT SELECT ON public.master_catalog_elektronik TO anon, authenticated;
GRANT ALL ON public.master_catalog_elektronik TO service_role;

-- 3) Seed Data
INSERT INTO public.master_catalog_elektronik (
  category, sub_category, brand_name, product_name,
  specifications, description, default_unit,
  suggested_price_min, suggested_price_max
) VALUES

-- === SMARTPHONE ===
(
  'Smartphone', 'Flagship Foldable',
  'Samsung', 'Galaxy Z Fold 6',
  'Layar Utama: 7.6" Dynamic AMOLED 2X 120Hz | Layar Cover: 6.3" | Snapdragon 8 Gen 3 for Galaxy | RAM 12GB | Storage 256GB/512GB/1TB | Kamera 50MP+12MP+10MP | Baterai 4400mAh | IP48',
  'Smartphone lipat premium generasi terbaru Samsung dengan performa flagship. '
  || 'Dilengkapi Galaxy AI untuk fitur Circle to Search, Live Translate, dan Note Assist. '
  || 'Desain lebih tipis dan ringan dibanding pendahulunya. Layar utama 7.6 inci cocok untuk multitasking dan produktivitas. '
  || 'Mendukung S Pen (dijual terpisah). Tersedia warna Silver Shadow, Pink, Navy, dan Crafted Black.',
  'unit', 24999000.00, 27999000.00
),
(
  'Smartphone', 'Flagship Foldable',
  'Samsung', 'Galaxy Z Flip 6',
  'Layar Utama: 6.7" FHD+ Dynamic AMOLED 2X 120Hz | Layar Cover: 3.4" Super AMOLED | Snapdragon 8 Gen 3 | RAM 12GB | Storage 256GB/512GB | Kamera 50MP+12MP | Baterai 4000mAh | IP48',
  'Smartphone lipat kompak dengan desain clamshell yang stylish. '
  || 'FlexWindow 3.4 inci untuk notifikasi, widget, dan selfie tanpa membuka HP. '
  || 'Galaxy AI terintegrasi penuh. Performa gaming dan multitasking lancar dengan Snapdragon 8 Gen 3. '
  || 'Tersedia warna Blue, Silver Shadow, Yellow, Mint, dan Crafted Black.',
  'unit', 14999000.00, 16999000.00
),
(
  'Smartphone', 'Flagship',
  'Samsung', 'Galaxy S25 Ultra',
  'Layar: 6.9" QHD+ Dynamic AMOLED 2X 120Hz | Snapdragon 8 Elite for Galaxy | RAM 12GB | Storage 256GB/512GB/1TB | Kamera 200MP+50MP+10MP+50MP | Baterai 5000mAh | S Pen built-in | IP68 | Titanium Frame',
  'Flagship ultimate Samsung dengan kamera 200MP dan S Pen terintegrasi. '
  || 'Frame titanium untuk durabilitas premium. Galaxy AI generasi terbaru dengan fitur Sketch to Image, '
  || 'Audio Eraser, dan ProVisual Engine. Performa terkencang di kelasnya untuk gaming dan editing video 8K. '
  || 'Tersedia warna Titanium Silverblue, Titanium Gray, Titanium Black, dan Titanium Whitesilver.',
  'unit', 21999000.00, 25999000.00
),
(
  'Smartphone', 'Flagship',
  'Apple', 'iPhone 16 Pro Max',
  'Layar: 6.9" Super Retina XDR OLED Always-On 120Hz ProMotion | Apple A18 Pro | RAM 8GB | Storage 256GB/512GB/1TB | Kamera 48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto | Baterai ~4685mAh | USB-C | IP68',
  'iPhone tercanggih dengan chip A18 Pro dan Camera Control button. '
  || 'Merekam video 4K 120fps Dolby Vision. Apple Intelligence terintegrasi untuk Siri yang lebih pintar, '
  || 'Writing Tools, dan Image Playground. Layar terbesar 6.9 inci dengan bezels paling tipis. '
  || 'Tersedia warna Desert Titanium, Natural Titanium, Black Titanium, dan White Titanium.',
  'unit', 22499000.00, 28999000.00
),

-- === LAPTOP ===
(
  'Laptop', 'Ultrabook Pro',
  'Apple', 'MacBook Pro 14" M4 Pro',
  'Layar: 14.2" Liquid Retina XDR 120Hz ProMotion | Chip Apple M4 Pro (12-core CPU, 16-core GPU) | RAM 24GB Unified | SSD 512GB/1TB/2TB | Thunderbolt 5 x3 | MagSafe 3 | HDMI 2.1 | SDXC | Wi-Fi 6E | Baterai 17 jam',
  'Laptop profesional Apple dengan chip M4 Pro untuk workflow kreatif berat. '
  || 'Performa luar biasa untuk video editing 4K/8K, 3D rendering, dan machine learning. '
  || 'Layar Liquid Retina XDR dengan kecerahan 1600 nits HDR. Speaker 6-driver dengan Spatial Audio. '
  || 'Thunderbolt 5 untuk transfer data super cepat. Cocok untuk content creator dan developer.',
  'unit', 29999000.00, 39999000.00
),
(
  'Laptop', 'Ultrabook',
  'Apple', 'MacBook Air 15" M4',
  'Layar: 15.3" Liquid Retina 500 nits | Chip Apple M4 (10-core CPU, 10-core GPU) | RAM 16GB/24GB/32GB Unified | SSD 256GB/512GB/1TB/2TB | Thunderbolt 4 x2 | MagSafe 3 | Wi-Fi 6E | Baterai 18 jam | Tebal 11.5mm | Berat 1.51kg',
  'Laptop paling tipis dan ringan di kelasnya dengan layar 15 inci. '
  || 'Fanless design — senyap total tanpa kipas. Performa M4 cukup untuk editing foto/video, coding, dan multitasking berat. '
  || 'Baterai tahan seharian penuh (18 jam). Cocok untuk mahasiswa, pekerja mobile, dan kreator konten.',
  'unit', 19999000.00, 27999000.00
),

-- === TABLET ===
(
  'Tablet', 'Flagship',
  'Apple', 'iPad Pro 13" M4',
  'Layar: 13" Ultra Retina XDR OLED Tandem 120Hz ProMotion | Chip Apple M4 | RAM 16GB | Storage 256GB-2TB | Kamera 12MP Wide + LiDAR | Face ID | Thunderbolt/USB 4 | Wi-Fi 6E | Apple Pencil Pro support | Magic Keyboard support',
  'Tablet paling powerful di dunia dengan layar OLED Tandem pertama dari Apple. '
  || 'Chip M4 memberikan performa setara laptop untuk editing video ProRes, ilustrasi 3D, dan CAD. '
  || 'Tebal hanya 5.1mm — perangkat Apple tertipis yang pernah dibuat. '
  || 'Mendukung Apple Pencil Pro dengan haptic feedback dan barrel roll.',
  'unit', 18999000.00, 28999000.00
),
(
  'Tablet', 'Mid-Range',
  'Samsung', 'Galaxy Tab S10 FE',
  'Layar: 10.9" TFT LCD 90Hz | Exynos 1480 | RAM 6GB/8GB | Storage 128GB/256GB + microSD | Kamera 8MP + 5MP | Baterai 8000mAh | S Pen included | IP68 | DeX Support',
  'Tablet Samsung dengan harga terjangkau namun fitur lengkap termasuk S Pen dalam kemasan. '
  || 'Baterai 8000mAh tahan seharian. Cocok untuk belajar online, membaca, dan hiburan multimedia. '
  || 'Samsung DeX untuk pengalaman desktop. Tahan air dan debu IP68.',
  'unit', 5999000.00, 7499000.00
),

-- === AKSESORI ===
(
  'Aksesori', 'TWS Earbuds',
  'Samsung', 'Galaxy Buds3 Pro',
  'Driver: 2-way (10.5mm Woofer + 6.1mm Planar Tweeter) | ANC Adaptive | 360 Audio | Codec AAC, SBC, SSC | IP57 | Baterai Buds 7 jam + Case 30 jam | Blade Light Design | USB-C',
  'TWS earbuds premium Samsung dengan desain blade transparan yang ikonik. '
  || 'Dual driver menghasilkan audio Hi-Fi berkualitas studio. ANC adaptif dengan 3 level intensitas. '
  || '360 Audio untuk pengalaman immersive saat menonton film atau gaming.',
  'unit', 3299000.00, 3799000.00
),
(
  'Aksesori', 'Smartwatch',
  'Apple', 'Apple Watch Ultra 2',
  'Layar: 49mm Always-On Retina LTPO OLED 3000 nits | Chip S9 SiP | GPS L1+L5 Dual-Frequency | Titanium Case | Depth Gauge + Water Temp | 100m Water Resistant | Baterai 36 jam (72 jam Low Power) | Action Button | Siren 86dB',
  'Smartwatch paling tangguh dari Apple untuk petualang dan atlet. '
  || 'Case titanium grade 5 dengan layar sapphire crystal 3000 nits (terbaca di bawah sinar matahari terik). '
  || 'GPS dual-frequency presisi tinggi untuk hiking dan diving hingga 40 meter. '
  || 'Cocok untuk triathlon, diving, dan aktivitas outdoor ekstrem.',
  'unit', 12999000.00, 14999000.00
),
(
  'Aksesori', 'Charger',
  'Anker', 'Anker Prime 200W GaN',
  'Output: 200W Total (USB-C x4 + USB-A x2) | GaN II Technology | PD 3.1 | PPS | QC 5.0 | Foldable Plug | LED Display | Charging 2 laptop sekaligus',
  'Charger multi-port terkuat dari Anker dengan total output 200W. '
  || 'Mampu mengisi daya 2 laptop dan 4 perangkat lainnya secara bersamaan. '
  || 'Teknologi GaN II membuat ukuran 50% lebih kecil dari charger biasa. LED display menampilkan watt real-time.',
  'unit', 1299000.00, 1599000.00
),
(
  'Aksesori', 'Casing & Proteksi',
  'Samsung', 'Galaxy Z Fold 6 Standing Grip Case',
  'Material: Polycarbonate + TPU | Grip Ring berdiri | Hinge Protection | Wireless Charging Compatible | Slim Profile',
  'Case resmi Samsung untuk Z Fold 6 dengan grip ring yang bisa berdiri. '
  || 'Melindungi engsel dan body tanpa menambah bulk. Kompatibel wireless charging. '
  || 'Tersedia warna Dark Grey dan Light Grey.',
  'unit', 799000.00, 999000.00
)

ON CONFLICT (brand_name, product_name) DO NOTHING;

-- Done! 12 produk elektronik siap digunakan.
