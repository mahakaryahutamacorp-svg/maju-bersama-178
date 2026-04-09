-- Seed user "owner" dengan password "112233" untuk login NextAuth.
-- Jalankan di Supabase SQL Editor setelah mb178-schema.sql dan rls-example.sql.
--
-- Password di-hash menggunakan scrypt (N=16384, r=8, p=1, keylen=32).

-- Hapus owner lama jika ada (agar bisa re-seed)
delete from mb178.app_users where user_id = 'owner';

insert into mb178.app_users (user_id, password_hash, password_salt, name, role, store_id)
values (
  'owner',
  '5iobioHZfbGSqbkeeegV9UWvgbGMoEJ965HMX5+2yFM=',
  'vHNNvtghTkgOZ/WKIREzhQ==',
  'Owner',
  'owner',
  'pupuk-maju'
);
