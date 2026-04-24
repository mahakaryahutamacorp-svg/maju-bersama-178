-- =============================================================================
-- Maju Bersama 178 - Hard Reset Script
-- =============================================================================
-- PERINGATAN KERAS: 
-- Script ini akan MENGHAPUS SEMUA DATA di database Anda (seluruh produk, 
-- pesanan, akun login pemilik toko, dan akun pelanggan).
-- Gunakan script ini HANYA jika Anda ingin mengulang dari 0 (NOL).
-- =============================================================================

-- 1. Hapus semua akun login (Owner, Admin, Customer)
DELETE FROM auth.users;

-- 2. Hapus semua tabel, fungsi, dan data yang ada di public
DROP SCHEMA IF EXISTS public CASCADE;

-- 3. Buat ulang wadah kosong untuk schema public
CREATE SCHEMA public;

-- 4. Kembalikan hak akses standar PostgreSQL ke schema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT USAGE, CREATE ON SCHEMA public TO authenticated;

-- =============================================================================
-- DONE.
-- Selanjutnya, jalankan secara berurutan:
-- 1. 00-setup-database.sql
-- 2. 01-create-auth-users.sql
-- =============================================================================
