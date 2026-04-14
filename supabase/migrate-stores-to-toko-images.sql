-- Migrasi sekali pakai: selaraskan toko dengan public/toko_images/ (tanpa reset schema).
-- Jalankan setelah backup. Asumsi DB masih memakai seed lama (8 slug placeholder).
-- Jika slug sudah sama dengan target, baris UPDATE untuk slug itu bisa dilewati.
BEGIN;
UPDATE public.stores
SET name = 'Maju Bersama Pupuk & Alat Pertanian'
WHERE slug = 'pupuk-maju';
UPDATE public.stores
SET slug = 'pestisida-mbp',
  name = 'Pestisida Maju Bersama'
WHERE slug = 'majubersamagrup';
UPDATE public.stores
SET slug = 'pakan-pei',
  name = 'Pakan PE''I Maju Bersama'
WHERE slug = 'toko-elektronik';
UPDATE public.stores
SET slug = 'rosaura-skin-clinic',
  name = 'Rosaura Skin Clinic'
WHERE slug = 'fashion-murah';
UPDATE public.stores
SET slug = 'drg-sona',
  name = 'Klinik drg. Sona'
WHERE slug = 'toko-bangunan';
UPDATE public.stores
SET slug = 'raniah-travel',
  name = 'Raniah Travel Umroh dan Haji'
WHERE slug = 'sembako-berkah';
UPDATE public.stores
SET slug = 'dapurku-seafood',
  name = 'Restoran Seafood Dapurku by Chef Hendra'
WHERE slug = 'toko-alat-tulis';
UPDATE public.stores
SET slug = 'rocell-gadget',
  name = 'Rocell Gadget'
WHERE slug = 'toko-kosmetik';
-- Legacy `app_users` (bukan auth.users). Hanya untuk perbaikan FK data lama.
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'mama01'
  AND s.slug = 'pupuk-maju';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko02'
  AND s.slug = 'pestisida-mbp';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko03'
  AND s.slug = 'pakan-pei';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko04'
  AND s.slug = 'rosaura-skin-clinic';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko05'
  AND s.slug = 'drg-sona';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko06'
  AND s.slug = 'raniah-travel';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko07'
  AND s.slug = 'dapurku-seafood';
UPDATE public.app_users u
SET store_id = s.id
FROM public.stores s
WHERE u.user_id = 'toko08'
  AND s.slug = 'rocell-gadget';
COMMIT;