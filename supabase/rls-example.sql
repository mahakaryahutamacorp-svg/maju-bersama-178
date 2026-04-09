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
alter table mb178.app_users enable row level security;
alter table mb178.orders enable row level security;
alter table mb178.order_items enable row level security;

-- ============================================================
-- app_users: semua operasi hanya via service role (bypass RLS).
-- Anon/authenticated tidak boleh baca password hash.
-- ============================================================
drop policy if exists "app_users_deny_all" on mb178.app_users;
create policy "app_users_deny_all"
on mb178.app_users
for all
to anon, authenticated
using (false)
with check (false);

-- ============================================================
-- stores & products: public read, write via service role only.
-- ============================================================
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

drop policy if exists "stores_block_writes" on mb178.stores;
create policy "stores_block_writes"
on mb178.stores
for insert
to anon, authenticated
with check (false);

drop policy if exists "stores_block_update" on mb178.stores;
create policy "stores_block_update"
on mb178.stores
for update
to anon, authenticated
using (false)
with check (false);

drop policy if exists "stores_block_delete" on mb178.stores;
create policy "stores_block_delete"
on mb178.stores
for delete
to anon, authenticated
using (false);

drop policy if exists "products_block_writes" on mb178.products;
create policy "products_block_writes"
on mb178.products
for insert
to anon, authenticated
with check (false);

drop policy if exists "products_block_update" on mb178.products;
create policy "products_block_update"
on mb178.products
for update
to anon, authenticated
using (false)
with check (false);

drop policy if exists "products_block_delete" on mb178.products;
create policy "products_block_delete"
on mb178.products
for delete
to anon, authenticated
using (false);

-- ============================================================
-- orders & order_items: read via service role, write via service role.
-- ============================================================
drop policy if exists "orders_select_all" on mb178.orders;
create policy "orders_select_all"
on mb178.orders
for select
to anon, authenticated
using (true);

drop policy if exists "orders_block_writes" on mb178.orders;
create policy "orders_block_writes"
on mb178.orders
for insert
to anon, authenticated
with check (false);

drop policy if exists "orders_block_update" on mb178.orders;
create policy "orders_block_update"
on mb178.orders
for update
to anon, authenticated
using (false)
with check (false);

drop policy if exists "orders_block_delete" on mb178.orders;
create policy "orders_block_delete"
on mb178.orders
for delete
to anon, authenticated
using (false);

drop policy if exists "order_items_select_all" on mb178.order_items;
create policy "order_items_select_all"
on mb178.order_items
for select
to anon, authenticated
using (true);

drop policy if exists "order_items_block_writes" on mb178.order_items;
create policy "order_items_block_writes"
on mb178.order_items
for insert
to anon, authenticated
with check (false);

drop policy if exists "order_items_block_update" on mb178.order_items;
create policy "order_items_block_update"
on mb178.order_items
for update
to anon, authenticated
using (false)
with check (false);

drop policy if exists "order_items_block_delete" on mb178.order_items;
create policy "order_items_block_delete"
on mb178.order_items
for delete
to anon, authenticated
using (false);

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
