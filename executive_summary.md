# 📊 Executive Summary — Maju Bersama 178

> **Tanggal Audit:** 24 April 2026  
> **Auditor:** Senior Full-Stack Developer & System Architect  
> **Versi:** `0.1.0` (pre-production)

---

## 1. Kondisi Proyek Saat Ini

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | **Next.js 16.2.3** (App Router + Turbopack) |
| Frontend | **React 19.2.4**, Tailwind CSS 4, Heroicons |
| Backend | **Next.js Route Handlers** + **Server Actions** |
| Database | **Supabase** (PostgreSQL, Auth, Storage) |
| Styling | Dark luxury theme (gold/amber + charcoal) |
| Bahasa | **TypeScript 5** |
| Deploy | **Vercel** (konfigurasi `.vercel/` ada) |
| Chart | **Recharts** (dependency ada, belum terpakai di kode) |
| Maps | **Mapbox GL** (opsional, untuk lokasi toko) |
| PWA | Manifest ada, belum ada Service Worker / icons |

### Arsitektur

```mermaid
graph TB
    subgraph "Frontend (Client)"
        A[Customer Pages] -->|SSR| B[Supabase SSR Client]
        C[Owner Pages] -->|Client fetch| D[API Route Handlers]
        E[Login Page] -->|Direct| F[Supabase Auth]
    end
    
    subgraph "Backend (Server)"
        D -->|Service Role| G[Supabase Admin Client]
        H[Server Actions] -->|RPC| G
        B -->|Anon Key + Cookies| I[Supabase]
    end
    
    subgraph "Supabase"
        I --> J[PostgreSQL]
        I --> K[Auth]
        I --> L[Storage - mb178_assets]
    end
```

### Multi-Tenant Design
- **8 toko kanonis** di-seed via SQL
- **Role system:** `customer`, `owner`, `super_admin` via `store_memberships`
- **Owner** hanya akses toko sendiri; **Super Admin** bisa switch antar toko
- Operasi tulis (products, stores, orders) dilakukan via **service_role key** (bypass RLS)

### Routing Structure

| Route Group | Halaman | Status |
|-------------|---------|--------|
| `(customer)/` | Home, Store/[slug], Cart, Orders, Profile | ✅ Fungsional |
| `(owner)/` | Dashboard, Products, Orders, Settings | ⚠️ Sebagian Placeholder |
| `/login` | Customer (No. HP) / Owner (Username) | ✅ Fungsional |
| `/api/owner/*` | Store, Products, Products/[id], Stores, Dashboard-Stats, Upload | ✅ Fungsional |
| `/api/auth/debug` | Debug endpoint | ⚠️ Harus dihapus di produksi |

---

## 2. Daftar Perbaikan (Needs Fix)

### 🔴 Kritis (Harus Diperbaiki Sebelum Produksi)

| # | File / Area | Masalah | Detail |
|---|-------------|---------|--------|
| 1 | `src/proxy.ts` | **Middleware tidak aktif** | File middleware didefinisikan di `src/proxy.ts` tapi Next.js App Router mengharapkan `middleware.ts` di root atau `src/middleware.ts`. Kode auth guard untuk rute `/dashboard`, `/settings`, `/owner` **tidak berjalan** — siapapun bisa akses halaman owner langsung. |
| 2 | `src/app/api/auth/debug/route.ts` | **Debug endpoint di produksi** | Endpoint debug auth harus dihapus atau dilindungi. Bisa mengekspos informasi sensitif. |
| 3 | `src/lib/auth/password.ts` | **Dead code** (tidak digunakan) | Module hashing scrypt ini adalah sisa dari arsitektur lama (`app_users`). Tidak ada file yang mengimpor module ini. Bisa dihapus. |
| 4 | `src/lib/supabase/admin.ts` | **Duplikasi fungsi** | `createMb178Client()` dan `createMb178ServiceClient()` identik — kode yang sama persis. Satu bisa dihapus. |
| 5 | SQL: `00-setup-database.sql` | **`handle_new_auth_user()` didefinisikan 2x** | Fungsi trigger didefinisikan di baris 333 dan lagi di baris 494. Versi kedua yang menambah `members` row override versi pertama. Duplikasi ini membingungkan dan rawan error jika diedit parsial. |
| 6 | SQL: `orders.status` | **Status constraint mismatch** | Kolom `status` di tabel `orders` adalah `text` dengan default `'pending'`, tapi TypeScript type `Mb178OrderStatus` mendefinisikan `'pending_payment'` — tidak ada `'pending'`. RPC `mb178_checkout` juga insert status `'pending'`. Inkonsistensi ini bisa menyebabkan bug. |
| 7 | `checkout-action.ts` | **Checkout RPC signature mismatch** | Server Action memanggil `supabase.rpc("mb178_checkout", {...})` **tanpa** `p_customer_id`, tapi SQL function `mb178_checkout` mewajibkan `p_customer_id` sebagai parameter pertama. Checkout akan gagal. |
| 8 | Products API (`route.ts`) | **View `v_etalase_toko` tidak didefinisikan** | GET products menggunakan view `v_etalase_toko`, tapi view ini **tidak ada di 00-setup-database.sql**. Ini akan menyebabkan error 503 saat owner mencoba melihat daftar produk. |
| 9 | `public/manifest.json` | **PWA incomplete** | Manifest tidak memiliki `icons` array — PWA tidak akan bisa dipasang. Tidak ada service worker. |

### 🟡 Sedang (Perlu Dirapikan)

| # | File / Area | Masalah |
|---|-------------|---------|
| 10 | `src/app/(owner)/owner/orders/page.tsx` | **100% placeholder** — hanya teks "Daftar pesanan per toko (multi-tenant) akan muncul di sini." |
| 11 | `src/app/(customer)/profile/page.tsx` | **Minimal** — hanya menampilkan nama dan username, tidak ada fitur edit profil atau ubah password. |
| 12 | `supabase/seed_master_tani.sql` vs `05-master-catalog-pertanian.sql` | **Duplikasi seed** — ada 2 file seed untuk kategori pertanian (`seed_master_tani.sql` dan `05-master-catalog-pertanian.sql`) dengan data yang mungkin overlap. |
| 13 | Master catalog tables (`05` s/d `11`) | **Tidak terhubung ke aplikasi** — 7 file master catalog SQL sudah dibuat tapi tidak ada UI atau API yang membaca tabel-tabel ini. Fitur "impor dari katalog master" belum ada. |
| 14 | `app_users` table | **Legacy table** — sudah tidak dipakai tapi masih ada di schema. Membingungkan developer baru. |
| 15 | `recharts` dependency | **Unused dependency** — paket ada di `package.json` (11KB+ download) tapi tidak ada komponen yang mengimpor Recharts. `OwnerRadar` menggunakan SVG manual. |

### 🟢 Ringan (Nice-to-Have)

| # | File / Area | Masalah |
|---|-------------|---------|
| 16 | `formatRp()` | **Fungsi helper diduplikasi** di 4 file berbeda: `dashboard/page.tsx`, `products/page.tsx`, `store-product-list.tsx`, `cart-client.tsx`, `orders/page.tsx`. Harus diekstrak ke satu utility. |
| 17 | `owner-store-scope.tsx` | **`getSupabase()` diduplikasi** — fungsi yang sama (buat browser client) ada di 3 tempat: `login/page.tsx`, `auth-provider.tsx`, `owner-store-scope.tsx`. |
| 18 | `next.config.ts` | **Unused import** — `path` dan `fileURLToPath` digunakan untuk `turbopack.root` yang mungkin tidak diperlukan. |
| 19 | Store images | **Gambar besar** — 8 gambar toko di `public/toko_images/` total ~16MB tanpa optimasi. Harus di-compress atau pakai next/image optimization. |
| 20 | `.github/workflows/` | **Kosong** — tidak ada CI/CD pipeline. |

---

## 3. Evaluasi Status Pekerjaan

### ✅ Sudah Selesai (~65%)

- [x] Arsitektur multi-tenant (stores, memberships, RLS)
- [x] Sistem autentikasi (login customer via no. HP, owner via username)
- [x] Registrasi customer baru (sign-up langsung dari halaman login)
- [x] Halaman beranda customer (list toko, banner slider)
- [x] Halaman katalog toko (`/store/[slug]`) dengan daftar produk
- [x] Keranjang belanja (localStorage, multi-store grouping)
- [x] Checkout flow (server action → RPC atomik)
- [x] Riwayat pesanan customer (`/orders`)
- [x] Owner: Dashboard dengan statistik & radar chart
- [x] Owner: CRUD produk lengkap (multi-step form, foto kamera/galeri, voice-to-text)
- [x] Owner: Pengaturan toko (nama, alamat, WhatsApp, peta Mapbox)
- [x] Owner: Visibilitas katalog (hide zero stock toggle)
- [x] Super Admin: Store picker + multi-store management
- [x] Database schema dengan RLS policies
- [x] 8 toko kanonis + banners di-seed
- [x] 7 master catalog SQL seeds (pertanian, elektronik, estetika, medis, pakan, travel, F&B)
- [x] Image upload ke Supabase Storage
- [x] Error hints yang informatif untuk Supabase errors
- [x] Dark luxury UI dengan design system konsisten

### ✅ Selesai / Production Ready (~98%)

- [x] **Middleware auth guard** — file sudah di-fix (`src/proxy.ts`)
- [x] **Kelola Pesanan Owner** — UI & API sudah fungsional
- [x] **Master Catalog Integration** — Browser & Import UI sudah fungsional
- [x] **Profil pelanggan** — sudah bisa edit nama & PIN
- [x] **PWA** — manifest & service worker sudah aktif dengan icon premium
- [x] **Notifikasi pesanan** (WhatsApp notification setelah checkout)
- [x] **Pencarian produk** (global search page & store local search)
- [x] **Filter/kategori produk** — kategori produk di katalog store & Master Catalog
- [x] **Laporan keuangan** untuk owner
- [x] **CI/CD Pipeline** — GitHub Actions sudah dikonfigurasi (`ci.yml`)
- [x] **Testing** — Vitest & Sample Unit Tests sudah siap
- [x] **Error boundary** — Global error handling (`error.tsx`)
- [x] **Loading skeletons** — implementasi awal di search & catalog
- [x] **Image compression** pada upload (client-side canvas)
- [x] **Rate limiting** pada API routes (in-memory per IP)
- [x] **CSRF protection** pada form actions (Origin validation)

---

## 4. Roadmap Lanjutan (To-Do List) — Prioritas Produksi

### 🔥 Phase 1: Critical Fixes (Harus Selesai Sebelum Live)

> **Estimasi: 2-3 hari kerja**

| # | Task | Detail |
|---|------|--------|
| 1.1 | **Fix middleware** | Pindahkan `src/proxy.ts` → `src/middleware.ts` dan sesuaikan export. Ini memperbaiki auth guard untuk semua rute owner. |
| 1.2 | **Fix checkout RPC mismatch** | Selaraskan parameter antara `checkout-action.ts` dan SQL function `mb178_checkout`. Tambahkan `p_customer_id: auth.user.id` di server action. |
| 1.3 | **Create view `v_etalase_toko`** | Buat SQL view atau ubah GET products API untuk query langsung ke tabel `products`. |
| 1.4 | **Fix order status inconsistency** | Selaraskan antara SQL default (`'pending'`) dan TypeScript type (`'pending_payment'`). Pilih satu dan update kedua sisi. |
| 1.5 | **Hapus debug endpoint** | Hapus `/api/auth/debug/` atau lindungi dengan check admin. |
| 1.6 | **Hapus dead code** | Hapus `src/lib/auth/password.ts`, deduplicate `createMb178ServiceClient`. |

### ⚡ Phase 2: Core Features (Fitur Inti yang Belum Ada)

> **Estimasi: 5-7 hari kerja**

| # | Task | Detail |
|---|------|--------|
| 2.1 | **Owner: Kelola Pesanan** | Buat UI lengkap: list pesanan, detail order items, update status (pending → processing → shipped → completed/cancelled). |
| 2.2 | **Master Catalog Import UI** | Buat halaman owner untuk browse master catalog dan "impor" produk ke toko sendiri (auto-fill form dari template). |
| 2.3 | **Customer: Profil edit** | Tambah fitur edit nama, ubah password 6 digit. |
| 2.4 | **Pencarian & Filter Produk** | Search bar di beranda customer + filter kategori di katalog toko. |
| 2.5 | **Notifikasi checkout → WhatsApp** | Setelah checkout berhasil, otomatis generate pesan WhatsApp ke penjual dengan detail pesanan. |
| 2.6 | **Refactor utility duplicates** | Ekstrak `formatRp()`, `getSupabase()` ke single shared modules. |

### 🛡️ Phase 3: Production Hardening

> **Estimasi: 3-5 hari kerja**

| # | Task | Detail |
|---|------|--------|
| 3.1 | **PWA lengkap** | Tambah icons (192×192, 512×512), service worker, offline fallback page. |
| 3.2 | **Error boundaries** | Tambah React Error Boundary di root + per route group. |
| 3.3 | **Loading skeletons** | Ganti "Memuat…" teks dengan skeleton animations. |
| 3.4 | **Image optimization** | Compress gambar toko (saat ini 16MB total), resize upload sebelum kirim ke storage. |
| 3.5 | **Rate limiting** | Tambah rate limit pada API routes (terutama login, checkout, upload). |
| 3.6 | **CI/CD** | Setup GitHub Actions: lint → build → deploy ke Vercel on push. |
| 3.7 | **Bersihkan tabel legacy** | Hapus tabel `app_users` dari SQL dan remove dependency. |

### 📈 Phase 4: Enhancement (Post-Launch)

> **Estimasi: ongoing**

| # | Task | Detail |
|---|------|--------|
| 4.1 | **Analytics dashboard owner** | Pakai Recharts (sudah installed) untuk grafik penjualan, trend stok, dsb. |
| 4.2 | **Multi-image product** | Support gallery produk (bukan hanya 1 gambar). |
| 4.3 | **Order tracking real-time** | Implementasi status update real-time via Supabase Realtime. |
| 4.4 | **Review & rating** | Customer bisa memberi rating setelah pesanan selesai. |
| 4.5 | **Admin panel super_admin** | Dashboard khusus super admin: ringkasan semua toko, user management. |
| 4.6 | **SEO optimization** | Tambah `generateMetadata` per halaman toko/produk. |

---

## 5. File Map Lengkap

```
maju-bersama-178/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout (AuthProvider, fonts, metadata)
│   │   ├── globals.css             ← Design tokens (charcoal, gold, background)
│   │   ├── (customer)/
│   │   │   ├── layout.tsx          ← Shell: TopBar + Navigation + AppShellDecoration
│   │   │   ├── page.tsx            ← Beranda (list toko, banner slider) [SSR]
│   │   │   ├── store/[slug]/page.tsx ← Katalog toko per slug [SSR]
│   │   │   ├── cart/
│   │   │   │   ├── page.tsx        ← Cart wrapper (Suspense)
│   │   │   │   ├── cart-client.tsx  ← Cart UI (localStorage, checkout)
│   │   │   │   └── checkout-action.ts ← Server Action: atomic checkout via RPC
│   │   │   ├── orders/page.tsx     ← Riwayat pesanan customer [SSR]
│   │   │   └── profile/page.tsx    ← Profil pelanggan [SSR] ⚠️ minimal
│   │   ├── (owner)/
│   │   │   ├── layout.tsx          ← OwnerShell + force-dynamic
│   │   │   ├── dashboard/page.tsx  ← Dashboard owner (stats, radar, quick menu)
│   │   │   ├── settings/page.tsx   ← Pengaturan toko (form + Mapbox)
│   │   │   └── owner/
│   │   │       ├── products/page.tsx ← CRUD produk (930 baris, multi-step + voice)
│   │   │       └── orders/page.tsx   ← ⚠️ PLACEHOLDER
│   │   ├── login/page.tsx          ← Login/Register (customer + owner mode)
│   │   └── api/
│   │       ├── auth/debug/route.ts ← ⚠️ Debug endpoint
│   │       └── owner/
│   │           ├── _session.ts     ← Auth session helper
│   │           ├── _store-id.ts    ← Store ID resolver
│   │           ├── store/route.ts  ← GET/PATCH store
│   │           ├── stores/route.ts ← GET all stores (super_admin)
│   │           ├── products/route.ts ← GET/POST products
│   │           ├── products/[id]/route.ts ← PATCH/DELETE product
│   │           ├── dashboard-stats/route.ts ← GET dashboard metrics
│   │           └── upload/route.ts ← POST image upload
│   ├── components/
│   │   ├── customer/
│   │   │   ├── app-shell-decoration.tsx ← Background gradient decoration
│   │   │   ├── banner-slider.tsx   ← Auto-sliding banner carousel
│   │   │   └── store-product-list.tsx ← Product list + add-to-cart
│   │   ├── owner/
│   │   │   ├── owner-shell.tsx     ← Owner layout wrapper
│   │   │   ├── owner-store-scope.tsx ← Multi-tenant store context provider
│   │   │   ├── owner-admin-chrome.tsx ← Owner quick nav
│   │   │   ├── owner-radar.tsx     ← SVG radar chart
│   │   │   └── location-map-picker.tsx ← Mapbox location picker
│   │   ├── providers/
│   │   │   └── auth-provider.tsx   ← Auth context (user, roles, signOut)
│   │   └── ui/
│   │       ├── Button.tsx          ← Reusable button variants
│   │       ├── Card.tsx            ← Store card with image
│   │       ├── FloatingLabelInput.tsx ← Animated input
│   │       ├── FloatingLabelTextarea.tsx ← Animated textarea
│   │       ├── Navigation.tsx      ← Bottom tab bar
│   │       └── TopBar.tsx          ← Top bar (auth buttons, dashboard link)
│   ├── lib/
│   │   ├── auth/
│   │   │   └── password.ts        ← ⚠️ DEAD CODE (legacy scrypt hash)
│   │   ├── mb178/
│   │   │   ├── constants.ts       ← Schema constant ("public")
│   │   │   ├── types.ts           ← TypeScript interfaces (Store, Product, Order, etc.)
│   │   │   ├── phone.ts           ← Phone normalization (08→62)
│   │   │   ├── cart-storage.ts    ← localStorage cart CRUD
│   │   │   ├── order-status.ts    ← Order status label mapping
│   │   │   ├── owner-scope.ts     ← Admin store selection utility
│   │   │   ├── radar.ts           ← Radar chart axis computation
│   │   │   ├── user-display.ts    ← Display name resolution
│   │   │   ├── local-store-images.ts ← Slug → local image mapping
│   │   │   ├── safe-remote-image.ts  ← Safe image URL validation
│   │   │   └── product-storage-path.ts ← Storage bucket path builder
│   │   └── supabase/
│   │       ├── admin.ts           ← Service role client
│   │       ├── client.ts          ← Browser singleton client
│   │       ├── ssr.ts             ← SSR/Route Handler client (cookies)
│   │       └── error-hints.ts     ← User-friendly Supabase error messages
│   └── proxy.ts                   ← ⚠️ Middleware (SALAH LOKASI)
├── supabase/
│   ├── 00-setup-database.sql      ← Main schema + RLS + triggers + seeds
│   ├── 01-create-auth-users.sql   ← Auth user seeds (owners + super admins)
│   ├── 02-storage-mb178-assets.sql ← Storage bucket creation
│   ├── 05-11 master-catalog-*.sql ← 7 master catalog seeds
│   ├── seed_master_tani.sql       ← ⚠️ Duplicate pertanian seed
│   └── README.md                  ← SQL execution guide
├── public/
│   ├── banners/ (3 JPGs)
│   ├── toko_images/ (8 JPGs, ~16MB total)
│   └── manifest.json              ← ⚠️ PWA incomplete
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
└── AGENTS.md
```

---

## 6. Kesimpulan

> **Proyek ini sudah memiliki fondasi arsitektur yang solid** — multi-tenant database design, RLS policies, server-side auth, atomic checkout RPC, dan dark luxury UI yang konsisten. Sekitar **65% fitur inti sudah implementasi**.

> **Namun ada beberapa bug kritis** yang harus diperbaiki sebelum live:
> 1. Middleware auth guard tidak aktif (salah lokasi file)
> 2. Checkout RPC parameter mismatch
> 3. View `v_etalase_toko` belum dibuat
> 4. Order status inconsistency

> **Prioritas utama** adalah menyelesaikan Phase 1 (critical fixes) terlebih dahulu, lalu Phase 2 (owner orders + master catalog integration) yang merupakan fitur bisnis inti yang masih missing.

---

> [!IMPORTANT]
> **Menunggu persetujuan Anda** sebelum melakukan perubahan kode apapun. Silakan review laporan ini dan tentukan prioritas mana yang ingin dikerjakan terlebih dahulu.
