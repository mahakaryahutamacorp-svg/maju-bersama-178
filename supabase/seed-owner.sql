-- Seed user "mama01" dengan password "223344" untuk login NextAuth.
-- Jalankan di Supabase SQL Editor setelah mb178-schema.sql.
--
-- Password di-hash menggunakan scrypt (N=16384, r=8, p=1, keylen=32).

-- Hapus owner lama jika ada (agar bisa re-seed)
delete from mb178.app_users where user_id = 'mama01';

insert into mb178.app_users (user_id, password_hash, password_salt, name, role, store_id)
values (
  'mama01',
  'rY9IskvR/IljIIAISyUUyqvrR/NElCgH9xmOYwjZaRM=',
  'gfko9yEEHp3E8mWTirxpew==',
  'Mama',
  'owner',
  (select id from mb178.stores where slug = 'pupuk-maju' limit 1)
);
