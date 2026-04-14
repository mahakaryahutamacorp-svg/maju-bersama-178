-- =============================================================================
-- HAPUS DATA: toko, membership, app_users, dan isi yang bergantung pada toko
-- =============================================================================
-- Urutan aman untuk FK (products/orders → stores).
-- TIDAK menghapus definisi tabel, RLS, atau auth.users.
-- Jalankan di Supabase → SQL Editor. Setelah itu jalankan:
--   mb178-toko-reset-dan-setup-lengkap.sql
-- =============================================================================
BEGIN;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.store_memberships;
DELETE FROM public.app_users;
DELETE FROM public.stores;
COMMIT;
-- Verifikasi:
-- SELECT COUNT(*) FROM public.stores;
-- SELECT COUNT(*) FROM public.store_memberships;
-- SELECT COUNT(*) FROM public.app_users;