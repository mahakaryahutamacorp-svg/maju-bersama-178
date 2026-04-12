-- Tambah deskripsi produk (jalankan sekali di Supabase SQL Editor jika DB sudah ada sebelum perubahan ini).
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description text;