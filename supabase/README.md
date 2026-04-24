# Supabase Setup — Maju Bersama 178 (mahakaryahutama)

## Project Info

- **Project ID**: `tinfsqdvuxnquentbned`
- **URL**: `https://tinfsqdvuxnquentbned.supabase.co`

## Wajib: provider Email aktif (login & daftar)

Aplikasi memetakan **no. HP** dan **username admin** ke alamat sintetis `...@mb178.online`, lalu memakai **Email + password** di Supabase Auth.

Jika di layar login muncul **`Email logins are disabled`** (atau daftar/masuk selalu gagal):

1. Buka **Supabase Dashboard** → **Authentication** → **Providers** → **Email**.
2. Pastikan **Email provider / Enable Email provider** dalam keadaan **aktif (ON)**.
3. Untuk **Daftar Baru** pelanggan: aktifkan juga **Allow new users to sign up** (nama menu bisa sedikit berbeda tergantung versi dashboard) — kalau dinonaktifkan, `signUp` dari anon key akan ditolak.
4. Setelah itu, jalankan **`02-create-auth-users.sql`** jika akun owner (`toko01` …) belum ada di **Authentication → Users**.

Tanpa langkah 1–2, **login admin dan daftar pelanggan tidak akan pernah berhasil**, walau kode aplikasi sudah benar.

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

Setelah **provider Email aktif** (lihat bagian di atas):

- Tombol **Daftar Baru** memanggil `POST /api/auth/register-customer` (perlu **`SUPABASE_SERVICE_ROLE_KEY`** di server) agar akun **langsung terkonfirmasi** tanpa e-mail verifikasi.
- Jika service role belum terisi, aplikasi fallback ke `signUp` biasa; supaya session langsung ada, di pengaturan Email Auth bisa **menonaktifkan “Confirm email”** (opsional, setelah keamanan Anda pertimbangkan).
