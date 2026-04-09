-- RLS untuk schema `mb178`.
--
-- Penting: aplikasi ini login memakai NextAuth (bukan Supabase Auth).
-- Artinya PostgREST tidak punya `auth.uid()` untuk mengikat owner -> store_id.
-- Strategi yang aman untuk production saat ini:
-- - SELECT katalog (stores/products) dibuka untuk publik
-- - INSERT/UPDATE/DELETE hanya dilakukan lewat server menggunakan SERVICE ROLE
--   (SERVICE ROLE key bypass RLS).
--
-- Jika nanti Anda ingin RLS owner per-store via Supabase Auth,
-- tambahkan tabel membership (mis. mb178.store_members) dan mapping `auth.uid()`.

-- Enable RLS
alter table mb178.stores enable row level security;
alter table mb178.products enable row level security;
alter table mb178.orders enable row level security;
alter table mb178.order_items enable row level security;

-- Public read katalog
drop policy if exists "stores_select_all" on mb178.stores;
create policy "stores_select_all"
on mb178.stores
for select
to anon, authenticated
using (true);

drop policy if exists "products_select_all" on mb178.products;
create policy "products_select_all"
on mb178.products
for select
to anon, authenticated
using (true);

-- Writes ditolak untuk anon/authenticated (write hanya via service role).
drop policy if exists "stores_block_writes" on mb178.stores;
create policy "stores_block_writes"
on mb178.stores
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "products_block_writes" on mb178.products;
create policy "products_block_writes"
on mb178.products
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "orders_block_writes" on mb178.orders;
create policy "orders_block_writes"
on mb178.orders
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "order_items_block_writes" on mb178.order_items;
create policy "order_items_block_writes"
on mb178.order_items
for all
to anon, authenticated
using (false)
with check (false);

-- Storage bucket `mb178_assets`
-- Rekomendasi: bucket public read (untuk gambar katalog), tapi upload via server.
-- Agar client (anon/authenticated) tidak bisa upload langsung, blok semua writes.
-- Catatan: pada sebagian project, user SQL editor Anda bukan owner `storage.objects`,
-- sehingga perintah ALTER/POLICY akan gagal dengan:
--   "must be owner of table objects"
--
-- Jika Anda menemui error itu, atur policy Storage lewat Dashboard:
-- Storage → Policies → `storage.objects`:
-- - SELECT: izinkan baca untuk bucket_id = 'mb178_assets'
-- - INSERT/UPDATE/DELETE: tolak untuk anon/authenticated (upload via server/service role)
--
-- Jika Anda memiliki akses owner/superuser, Anda bisa menambahkan policy via SQL
-- (uncomment blok berikut).
--
-- alter table storage.objects enable row level security;
--
-- drop policy if exists "mb178_assets_public_read" on storage.objects;
-- create policy "mb178_assets_public_read"
-- on storage.objects
-- for select
-- to anon, authenticated
-- using (bucket_id = 'mb178_assets');
--
-- drop policy if exists "mb178_assets_block_writes" on storage.objects;
-- create policy "mb178_assets_block_writes"
-- on storage.objects
-- for all
-- to anon, authenticated
-- using (false)
-- with check (false);
