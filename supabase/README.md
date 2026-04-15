# Supabase Setup — Maju Bersama 178 (mahakaryahutama)

## Project Info

- **Project Name**: mahakaryahutama's Project
- **Project ID**: `tinfsqdvuxnquentbned`
- **URL**: `https://tinfsqdvuxnquentbned.supabase.co`
- **Region**: ap-northeast-2

## Database Schema

### Tables (public schema)

| Table | Description | RLS |
|-------|-------------|-----|
| `stores` | Katalog 8 toko kanonis | ✓ |
| `products` | Produk per toko | ✓ |
| `orders` | Pesanan customer | ✓ |
| `order_items` | Item dalam pesanan | ✓ |
| `banners` | Slider promosi homepage | ✓ |
| `profiles` | Profil user (1:1 auth.users) | ✓ |
| `members` | Nama tampilan opsional pelanggan (1:1 auth.users) | ✓ |
| `store_memberships` | Relasi user-store dengan role | ✓ |
| `app_users` | LEGACY - tidak dipakai | ✓ |

### Enum Types

- `store_role`: `'customer'`, `'owner'`, `'super_admin'`

### Functions

- `has_store_role(store_id, roles[])` — Cek apakah user punya role tertentu di toko
- `handle_new_auth_user()` — Trigger: auto-create `profiles` + `members` saat user signup
- `mb178_checkout(...)` — Atomic checkout (service_role only)

## Akun Login

### Owner Toko (password: `223344`)

| Email | Toko |
|-------|------|
| mama01@local.mb178 | Maju Bersama Pupuk & Alat Pertanian |
| toko02@local.mb178 | Pestisida Maju Bersama |
| toko03@local.mb178 | Pakan PE'I Maju Bersama |
| toko04@local.mb178 | Rosaura Skin Clinic |
| toko05@local.mb178 | Klinik drg. Sona |
| toko06@local.mb178 | Raniah Travel Umroh dan Haji |
| toko07@local.mb178 | Restoran Seafood Dapurku by Chef Hendra |
| toko08@local.mb178 | Rocell Gadget |

### Super Admin (password: `178178`)

| Email | Role |
|-------|------|
| master@local.mb178 | Super Admin (akses semua toko) |
| mb178@local.mb178 | Super Admin (akses semua toko) |

## Storage (foto produk)

- Bucket: **`mb178_assets`** (publik baca).
- Path per toko: **`stores/{slug}/products/{timestamp}-{file}`** (slug dari `public.stores`).
- Jalankan **`02-storage-mb178-assets.sql`** sekali setelah database ada (membuat bucket + policy). Tanpa bucket, unggah gambar dari dashboard owner akan gagal.

## SQL Files

1. **00-setup-database.sql** — Setup lengkap: schema, tables, RLS, functions, seed data
2. **01-create-auth-users.sql** — Buat akun auth users dan memberships
3. **02-storage-mb178-assets.sql** — Bucket `mb178_assets` + kebijakan Storage
4. **03-members-display-name.sql** — Tabel `members` + RLS + trigger menyinkronkan `display_name` (opsional) dari metadata pendaftaran

## Cara Reset Database

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan `00-setup-database.sql` (reset penuh)
3. Jalankan `01-create-auth-users.sql` (buat akun)
4. Jalankan `03-members-display-name.sql` jika belum (tabel `members` + trigger gabungan)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL="https://tinfsqdvuxnquentbned.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
