This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Konfigurasi Vercel ke GitHub

Repo ini sekarang memakai GitHub Actions untuk deploy ke Vercel, jadi tidak tergantung auto-deploy bawaan Git integration.

### 1) Tambahkan GitHub Secrets

Di GitHub repo: **Settings → Secrets and variables → Actions**, buat 3 secret berikut:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Cara mendapatkan nilai:

1. Buat token di Vercel: **Settings → Tokens**
2. Jalankan `npx vercel link` di lokal project ini
3. Ambil `orgId` dan `projectId` dari file `.vercel/project.json` (jangan commit folder `.vercel`)

### 2) Tambahkan Environment Variables di Vercel

Isi environment variables di dashboard Vercel sesuai `.env.example`:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### 3) Alur Deploy

- **Pull Request ke `master`**: membuat **Preview Deployment**
- **Push/Merge ke `master`**: membuat **Production Deployment**

Workflow file: `.github/workflows/vercel.yml`

> Jika sebelumnya memakai auto-deploy dari Vercel Git Integration, sebaiknya nonaktifkan salah satu metode agar tidak terjadi deploy ganda.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
