# Maju Bersama 178

Marketplace multi-toko (Next.js App Router, NextAuth, Supabase). Font: Inter + Playfair Display (`src/app/layout.tsx`).

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Salin variabel dari [`.env.example`](.env.example) ke `.env.local`.

## Setup database (Supabase)

Satu skrip untuk **reset `public` + schema lama `mb178`**, lalu tabel, RLS, dan data awal (8 toko + owner + master admin):

1. Di [Supabase SQL Editor](https://supabase.com/dashboard), jalankan **seluruh** isi file [`supabase/setup-complete.sql`](supabase/setup-complete.sql).
2. Skrip ini **`DROP SCHEMA public CASCADE`** — hanya untuk proyek Supabase yang memang khusus aplikasi ini.
3. Schema **`public`** sudah default untuk API; tidak perlu menambah schema kustom di Exposed schemas (kecuali Anda menghapus `public` dari daftar).
4. Buat bucket Storage **`mb178_assets`** (detail di komentar STORAGE dalam skrip SQL).

## Konfigurasi Vercel ke GitHub

Repo memakai GitHub Actions untuk deploy ke Vercel.

### GitHub Secrets

Di **Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Cara mendapatkan nilai: token di Vercel **Settings → Tokens**; `orgId` dan `projectId` dari `npx vercel link` → `.vercel/project.json` (jangan commit folder `.vercel`).

### Environment variables di Vercel

Sesuai `.env.example`:

- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### Alur deploy

- **Pull request ke `master`**: Preview Deployment
- **Push/merge ke `master`**: Production Deployment

Workflow: [`.github/workflows/vercel.yml`](.github/workflows/vercel.yml)

> Jika Vercel Git Integration juga aktif, nonaktifkan salah satu agar tidak deploy ganda.
