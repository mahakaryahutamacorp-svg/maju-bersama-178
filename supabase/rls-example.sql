-- Contoh kebijakan RLS multi-tenant (jalankan di Supabase SQL editor setelah tabel ada)
-- Asumsi: auth.uid() dipetakan ke profile dengan store_id untuk owner

-- alter table products enable row level security;
-- alter table orders enable row level security;

-- Pelanggan: hanya lihat produk semua toko (atau sesuaikan)
-- create policy "products_select_all" on products for select using (true);

-- Owner: CRUD produk hanya untuk store_id miliknya
-- create policy "products_owner_all" on products for all using (
--   store_id in (select store_id from profiles where id = auth.uid())
-- );

-- create policy "orders_store_access" on orders for all using (
--   store_id in (select store_id from profiles where id = auth.uid())
--   or customer_id = auth.uid()
-- );
