# Walkthrough: Master Catalog Generation — Semua Toko MB178

## Ringkasan

Berhasil membuat **6 file SQL master catalog baru** untuk melengkapi seluruh 8 toko di ekosistem Maju Bersama 178. Setiap file berisi DDL (CREATE TABLE, INDEX, RLS, GRANTS) dan seed data produk/layanan.

## Mapping Toko → Katalog

| # | Toko | Slug | File SQL | Jumlah Item |
|---|------|------|----------|-------------|
| 1 | Maju Bersama Pupuk & Alat Pertanian | `pupuk-maju` | `05-master-catalog-pertanian.sql` + `seed_master_tani.sql` *(sudah ada)* | 10 produk |
| 2 | Pestisida Maju Bersama | `pestisida-mbp` | *(sama — pakai `master_catalog_pertanian`)* | *(shared)* |
| 3 | Rocell Gadget | `rocell-gadget` | `06-master-catalog-elektronik.sql` ✅ **BARU** | 12 produk |
| 4 | Rosaura Skin Clinic | `rosaura-skin-clinic` | `07-master-catalog-estetika.sql` ✅ **BARU** | 10 item |
| 5 | Klinik drg. Sona | `drg-sona` | `08-master-catalog-medis.sql` ✅ **BARU** | 10 layanan |
| 6 | Pakan PE'I Maju Bersama | `pakan-pei` | `09-master-catalog-pakan.sql` ✅ **BARU** | 8 produk |
| 7 | Raniah Travel Umroh dan Haji | `raniah-travel` | `10-master-catalog-travel.sql` ✅ **BARU** | 6 paket |
| 8 | Restoran Seafood Dapurku | `dapurku-seafood` | `11-master-catalog-fnb.sql` ✅ **BARU** | 10 menu |

**Total: 66 item katalog** di seluruh 7 tabel master catalog.

## Urutan Eksekusi di Supabase SQL Editor

```
1. 05-master-catalog-pertanian.sql   (DDL tabel — jika belum)
2. seed_master_tani.sql              (seed data pertanian — jika belum)
3. 06-master-catalog-elektronik.sql  (DDL + seed elektronik)
4. 07-master-catalog-estetika.sql    (DDL + seed estetika)
5. 08-master-catalog-medis.sql       (DDL + seed medis/dental)
6. 09-master-catalog-pakan.sql       (DDL + seed pakan ternak)
7. 10-master-catalog-travel.sql      (DDL + seed travel)
8. 11-master-catalog-fnb.sql         (DDL + seed F&B)
```

> [!IMPORTANT]
> Semua file menggunakan `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, dan `CREATE INDEX IF NOT EXISTS` — **aman dijalankan ulang** (idempotent) tanpa risiko duplikasi data.

## Tabel Baru yang Dibuat

| Tabel | Unique Constraint | Kolom Khusus Domain |
|-------|-------------------|---------------------|
| `master_catalog_elektronik` | `(brand_name, product_name)` | `specifications` |
| `master_catalog_estetika` | `(brand_name, product_name)` | `ingredients` |
| `master_catalog_medis` | `(category, service_name)` | `service_code`, `service_name` |
| `master_catalog_pakan` | `(brand_name, product_name)` | `composition` |
| `master_catalog_travel` | `(category, package_name)` | `package_name`, `duration` |
| `master_catalog_fnb` | `(category, menu_name)` | `menu_name` |

## Pola Keamanan (Konsisten Semua Tabel)

- ✅ RLS enabled
- ✅ SELECT hanya `is_active = true` untuk `anon` dan `authenticated`
- ✅ INSERT/UPDATE/DELETE diblokir untuk client (hanya `service_role`)
- ✅ GRANT SELECT ke `anon, authenticated`; GRANT ALL ke `service_role`
