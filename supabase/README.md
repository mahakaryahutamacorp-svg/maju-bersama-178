# Supabase Setup — Maju Bersama 178 (mahakaryahutama)

## Project Info

- **Project ID**: `tinfsqdvuxnquentbned`
- **URL**: `https://tinfsqdvuxnquentbned.supabase.co`

## Execution Order

Jalankan skrip SQL di Supabase SQL Editor sesuai urutan berikut:

1. **`01-setup-database.sql`** — Reset schema, buat tabel, view, fungsi, trigger, dan data toko dasar.
2. **`02-create-auth-users.sql`** — Buat akun login Owner & Super Admin.
3. **`03-storage-mb178-assets.sql`** — Setup Storage Bucket & Policies.
4. **`05` s/d `11`** — (Opsional) Load Master Catalog per kategori.

## Akun Login

### Owner Toko (password: `223344`)

| Email | Toko |
|-------|------|
| <toko01@mb178.online> | Maju Bersama Pupuk & Alat Pertanian |
| <toko02@mb178.online> | Pestisida Maju Bersama |
| <toko03@mb178.online> | Pakan PE'I Maju Bersama |
| <toko04@mb178.online> | Rosaura Skin Clinic |
| <toko05@mb178.online> | Klinik drg. Sona |
| <toko06@mb178.online> | Raniah Travel Umroh dan Haji |
| <toko07@mb178.online> | Restoran Seafood Dapurku by Chef Hendra |
| <toko08@mb178.online> | Rocell Gadget |

### Super Admin (password: `178178`)

| Email | Role |
|-------|------|
| <master@mb178.online> | Master Admin |
| <mb178@mb178.online> | Pemilik MB178 |

## Catatan Penting

- Menjalankan `01-setup-database.sql` akan menghapus semua data di schema `public`.
- Pastikan variabel lingkungan `.env.local` sudah terisi dengan benar sebelum menjalankan aplikasi.

## Daftar pelanggan (tanpa verifikasi email)

Tombol **Daftar Baru** di `/login` memakai route server `POST /api/auth/register-customer` yang membuat user Auth dengan email sintetis **langsung terkonfirmasi**. Pastikan **`SUPABASE_SERVICE_ROLE_KEY`** terisi di `.env.local` / Vercel (server-only).

Jika service role belum ada, aplikasi akan mencoba `signUp` biasa; agar tetap langsung aktif, di Supabase Dashboard → **Authentication → Providers → Email** nonaktifkan **Confirm email**.
