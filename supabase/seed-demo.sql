-- Seed demo data untuk MB178:
-- - 4 toko
-- - 4 admin toko (owner) terkait masing-masing toko
-- - 1 master admin (super_admin)
--
-- Jalankan di Supabase SQL Editor (schema mb178 harus sudah ada).
-- Catatan: Script ini adaptif untuk beberapa variasi kolom pada tabel `mb178.stores`
-- seperti `name` vs `store_name`, dan `id` bertipe text atau uuid.

do $$
declare
  stores_id_type text;
  has_store_name boolean;
  has_name boolean;
  has_address boolean;
  has_whatsapp_link boolean;
  has_lat boolean;
  has_lng boolean;
  has_slug boolean;

  s1_id text;
  s2_id text;
  s3_id text;
  s4_id text;

  insert_sql text;
  products_store_id_type text;
  has_products_unit boolean;
  has_products_image_url boolean;
  insert_product_sql text;
begin
  -- sanity: app_users harus ada (untuk login userId + password)
  if not exists (
    select 1 from information_schema.tables
    where table_schema='mb178' and table_name='app_users'
  ) then
    raise exception 'Tabel mb178.app_users belum ada. Jalankan supabase/mb178-schema.sql (bagian app_users) terlebih dahulu.';
  end if;

  select data_type
  into stores_id_type
  from information_schema.columns
  where table_schema='mb178' and table_name='stores' and column_name='id';

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='slug'
  ) into has_slug;

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='store_name'
  ) into has_store_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='name'
  ) into has_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='address'
  ) into has_address;

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='whatsapp_link'
  ) into has_whatsapp_link;

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='lat'
  ) into has_lat;

  select exists (
    select 1 from information_schema.columns
    where table_schema='mb178' and table_name='stores' and column_name='lng'
  ) into has_lng;

  if not has_slug then
    raise exception 'Kolom mb178.stores.slug tidak ditemukan. Pastikan schema mb178 sudah sesuai dan exposed.';
  end if;

  -- helper builder untuk insert stores (kolom adaptif) + return id::text
  insert_sql :=
    'insert into mb178.stores (' ||
      'id, slug, ' ||
      case
        when has_store_name and has_name then 'store_name, name, '
        when has_store_name then 'store_name, '
        when has_name then 'name, '
        else ''
      end ||
      case when has_address then 'address, ' else '' end ||
      case when has_whatsapp_link then 'whatsapp_link, ' else '' end ||
      case when has_lat then 'lat, ' else '' end ||
      case when has_lng then 'lng, ' else '' end ||
    'created_at' ||
    ') values (' ||
      '$1, $2, ' ||
      case
        when has_store_name and has_name then '$3, $3, '
        when has_store_name then '$3, '
        when has_name then '$3, '
        else ''
      end ||
      case when has_address then '$4, ' else '' end ||
      case when has_whatsapp_link then '$5, ' else '' end ||
      case when has_lat then '$6, ' else '' end ||
      case when has_lng then '$7, ' else '' end ||
      'now()' ||
    ') on conflict (slug) do update set ' ||
      case
        when has_store_name and has_name then 'store_name=excluded.store_name, name=excluded.name'
        when has_store_name then 'store_name=excluded.store_name'
        when has_name then 'name=excluded.name'
        else 'slug=excluded.slug'
      end ||
    ' returning id::text';

  -- Insert / upsert 4 toko
  if stores_id_type = 'uuid' then
    execute insert_sql
      using gen_random_uuid(), 'toko-1', 'Toko 1 - MB178', 'Jl. Contoh No. 1', 'https://wa.me/6281211172228', -6.2001, 106.8401
      into s1_id;
    execute insert_sql
      using gen_random_uuid(), 'toko-2', 'Toko 2 - MB178', 'Jl. Contoh No. 2', 'https://wa.me/6281211172228', -6.2002, 106.8402
      into s2_id;
    execute insert_sql
      using gen_random_uuid(), 'toko-3', 'Toko 3 - MB178', 'Jl. Contoh No. 3', 'https://wa.me/6281211172228', -6.2003, 106.8403
      into s3_id;
    execute insert_sql
      using gen_random_uuid(), 'toko-4', 'Toko 4 - MB178', 'Jl. Contoh No. 4', 'https://wa.me/6281211172228', -6.2004, 106.8404
      into s4_id;
  else
    execute insert_sql
      using 'toko-1', 'toko-1', 'Toko 1 - MB178', 'Jl. Contoh No. 1', 'https://wa.me/6281211172228', -6.2001, 106.8401
      into s1_id;
    execute insert_sql
      using 'toko-2', 'toko-2', 'Toko 2 - MB178', 'Jl. Contoh No. 2', 'https://wa.me/6281211172228', -6.2002, 106.8402
      into s2_id;
    execute insert_sql
      using 'toko-3', 'toko-3', 'Toko 3 - MB178', 'Jl. Contoh No. 3', 'https://wa.me/6281211172228', -6.2003, 106.8403
      into s3_id;
    execute insert_sql
      using 'toko-4', 'toko-4', 'Toko 4 - MB178', 'Jl. Contoh No. 4', 'https://wa.me/6281211172228', -6.2004, 106.8404
      into s4_id;
  end if;

  -- Upsert akun owner + master
  -- Password tersimpan hash+salt (scrypt) agar cocok dengan `src/lib/auth/password.ts`.
  -- owner_1..4 password: 112233
  -- master password: 778899
  insert into mb178.app_users (user_id, password_hash, password_salt, name, role, store_id)
  values
    ('owner_1', 'PZSR3qm+JraHaJ9uCElF2O8qTElnH4ZK0JDM/WevuFg=', '5iEBQ95Zbmrhqhju7q+UYw==', 'Owner Toko 1', 'owner', s1_id),
    ('owner_2', '+vSq41yWaXi1m7H4yi6IfD721U1fgScaWGLNEAST5OE=', '1GNDBp582MmrFLQuNKurGA==', 'Owner Toko 2', 'owner', s2_id),
    ('owner_3', '3zB3bvvL/6Xv2gXpZnzgZ479bV+lCXwRbE4y8tAp6R4=', 'BqMUFCdFZe0M/S5kB5CupQ==', 'Owner Toko 3', 'owner', s3_id),
    ('owner_4', 'bzzYSnXxqt+swcU3G6wDdwvARS+uCfCZEg7uAuwvR4I=', '2F06YVpkxBmo6f3Ln6dNtA==', 'Owner Toko 4', 'owner', s4_id),
    ('master',  'yvoe0H2A9C7JDFuVc0DMrVxCW7E1SWlquHiLd3BXuiU=', 'ey2pyW3QWIyry5mG+HyxFw==', 'Master Admin', 'super_admin', null)
  on conflict (user_id) do update set
    password_hash = excluded.password_hash,
    password_salt = excluded.password_salt,
    name = excluded.name,
    role = excluded.role,
    store_id = excluded.store_id;

  -- Seed produk contoh per toko (jika tabel products ada)
  if exists (
    select 1 from information_schema.tables
    where table_schema='mb178' and table_name='products'
  ) then
    select data_type
    into products_store_id_type
    from information_schema.columns
    where table_schema='mb178' and table_name='products' and column_name='store_id';

    select exists (
      select 1 from information_schema.columns
      where table_schema='mb178' and table_name='products' and column_name='unit'
    ) into has_products_unit;

    select exists (
      select 1 from information_schema.columns
      where table_schema='mb178' and table_name='products' and column_name='image_url'
    ) into has_products_image_url;

    insert_product_sql :=
      'insert into mb178.products (store_id, name, price, stock, ' ||
        case when has_products_unit then 'unit, ' else '' end ||
        case when has_products_image_url then 'image_url, ' else '' end ||
      'created_at) ' ||
      'select ' ||
        case when products_store_id_type = 'uuid' then '$1::uuid' else '$1::text' end ||
        ', $2, $3, $4, ' ||
        case when has_products_unit then '$5, ' else '' end ||
        case when has_products_image_url then '$6, ' else '' end ||
        'now() ' ||
      'where not exists (select 1 from mb178.products where store_id = ' ||
        case when products_store_id_type = 'uuid' then '$1::uuid' else '$1::text' end ||
        ' and name = $2);';

    -- Toko 1 (campuran barang)
    execute insert_product_sql using s1_id, 'Pupuk NPK 16-16-16', 185000, 20,
      (case when has_products_unit then 'kg' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s1_id, 'Urea Subsidi', 125000, 35,
      (case when has_products_unit then 'kg' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s1_id, 'Semprotan 2L', 65000, 12,
      (case when has_products_unit then 'pcs' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s1_id, 'Pestisida Organik', 55000, 18,
      (case when has_products_unit then 'liter' else null end),
      (case when has_products_image_url then null else null end);

    -- Toko 2 (barang)
    execute insert_product_sql using s2_id, 'Bibit Cabai Rawit', 25000, 40,
      (case when has_products_unit then 'pcs' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s2_id, 'Bibit Tomat', 22000, 30,
      (case when has_products_unit then 'pcs' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s2_id, 'Pupuk Cair Premium', 78000, 10,
      (case when has_products_unit then 'liter' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s2_id, 'Pot Tanaman', 12000, 75,
      (case when has_products_unit then 'pcs' else null end),
      (case when has_products_image_url then null else null end);

    -- Toko 3 (jasa + barang)
    execute insert_product_sql using s3_id, 'Jasa Treatment Hama', 150000, 50,
      (case when has_products_unit then 'treatment' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s3_id, 'Jasa Kunjungan Kebun', 200000, 25,
      (case when has_products_unit then 'kunjungan' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s3_id, 'Herbisida 1L', 88000, 14,
      (case when has_products_unit then 'liter' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s3_id, 'Fungisida', 99000, 9,
      (case when has_products_unit then 'liter' else null end),
      (case when has_products_image_url then null else null end);

    -- Toko 4 (barang)
    execute insert_product_sql using s4_id, 'Pupuk Kompos', 35000, 60,
      (case when has_products_unit then 'kg' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s4_id, 'Sekop Taman', 45000, 22,
      (case when has_products_unit then 'pcs' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s4_id, 'Selang 10m', 98000, 8,
      (case when has_products_unit then 'pcs' else null end),
      (case when has_products_image_url then null else null end);
    execute insert_product_sql using s4_id, 'Nutrisi Tanaman', 42000, 15,
      (case when has_products_unit then 'liter' else null end),
      (case when has_products_image_url then null else null end);
  end if;
end $$;

-- Ringkasan kredensial:
-- - owner_1 / 112233  (Toko slug: toko-1)
-- - owner_2 / 112233  (Toko slug: toko-2)
-- - owner_3 / 112233  (Toko slug: toko-3)
-- - owner_4 / 112233  (Toko slug: toko-4)
-- - master  / 778899  (super_admin)

