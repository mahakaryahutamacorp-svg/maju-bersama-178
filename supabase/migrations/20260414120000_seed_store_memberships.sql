-- Seed public.store_memberships for owner + super_admin accounts.
--
-- Prerequisite: each account must exist in Supabase Auth with email:
--   {username}@local.mb178
-- matching the login form (e.g. mama01 → mama01@local.mb178).
--
-- Owner mapping aligns with public.stores slugs (post migrate-stores-to-toko-images):
--   mama01  → pupuk-maju
--   toko02  → pestisida-mbp
--   toko03  → pakan-pei
--   toko04  → rosaura-skin-clinic
--   toko05  → drg-sona
--   toko06  → raniah-travel
--   toko07  → dapurku-seafood
--   toko08  → rocell-gadget
--
-- Super admins (master, mb178): one row per store so RLS has_store_role() applies
-- for orders/products in any selected store.
--
-- Run via Supabase SQL Editor or `supabase db push` after migrations 202604141031 / 033.

BEGIN;

INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT u.id,
  s.id,
  'owner'::public.store_role
FROM auth.users u
JOIN (
  VALUES ('mama01@local.mb178', 'pupuk-maju'),
    ('toko02@local.mb178', 'pestisida-mbp'),
    ('toko03@local.mb178', 'pakan-pei'),
    ('toko04@local.mb178', 'rosaura-skin-clinic'),
    ('toko05@local.mb178', 'drg-sona'),
    ('toko06@local.mb178', 'raniah-travel'),
    ('toko07@local.mb178', 'dapurku-seafood'),
    ('toko08@local.mb178', 'rocell-gadget')
) AS m(email, slug) ON lower(u.email) = lower(m.email)
JOIN public.stores s ON s.slug = m.slug
ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO UPDATE
SET role = EXCLUDED.role;

INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT u.id,
  s.id,
  'super_admin'::public.store_role
FROM auth.users u
CROSS JOIN public.stores s
WHERE lower(u.email) IN ('master@local.mb178', 'mb178@local.mb178')
ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO UPDATE
SET role = EXCLUDED.role;

COMMIT;
