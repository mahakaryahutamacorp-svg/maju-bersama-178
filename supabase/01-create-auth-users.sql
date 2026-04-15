-- =============================================================================
-- Maju Bersama 178 (mahakaryahutama) — Create Auth Users & Memberships
-- =============================================================================
-- Jalankan SETELAH 00-setup-database.sql
--
-- Isi:
--   - 8 owner toko + 2 super_admin (master, mb178)
--   - Password bcrypt hash
--   - email_confirmed_at = now() (tidak perlu konfirmasi email)
--   - auth.identities (provider email)
--   - public.store_memberships (role owner / super_admin per mapping)
--
-- Akun:
--   Owner toko (password: 223344):
--     mama01@local.mb178 → pupuk-maju
--     toko02@local.mb178 → pestisida-mbp
--     toko03@local.mb178 → pakan-pei
--     toko04@local.mb178 → rosaura-skin-clinic
--     toko05@local.mb178 → drg-sona
--     toko06@local.mb178 → raniah-travel
--     toko07@local.mb178 → dapurku-seafood
--     toko08@local.mb178 → rocell-gadget
--
--   Super admin (password: 178178):
--     master@local.mb178
--     mb178@local.mb178
--
-- Idempotent: jika email sudah ada, baris itu dilewati.
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE rec record;
new_id uuid;
pwd_hash text;
meta jsonb;
BEGIN FOR rec IN
SELECT *
FROM (
    VALUES (
        'mama01@local.mb178',
        '223344',
        'Mama',
        'pupuk-maju'
      ),
      (
        'toko02@local.mb178',
        '223344',
        'Owner MBG',
        'pestisida-mbp'
      ),
      (
        'toko03@local.mb178',
        '223344',
        'Owner Elektronik',
        'pakan-pei'
      ),
      (
        'toko04@local.mb178',
        '223344',
        'Owner Fashion',
        'rosaura-skin-clinic'
      ),
      (
        'toko05@local.mb178',
        '223344',
        'Owner Bangunan',
        'drg-sona'
      ),
      (
        'toko06@local.mb178',
        '223344',
        'Owner Sembako',
        'raniah-travel'
      ),
      (
        'toko07@local.mb178',
        '223344',
        'Owner ATK',
        'dapurku-seafood'
      ),
      (
        'toko08@local.mb178',
        '223344',
        'Owner Kosmetik',
        'rocell-gadget'
      ),
      (
        'master@local.mb178',
        '178178',
        'Master Admin',
        NULL::text
      ),
      (
        'mb178@local.mb178',
        '178178',
        'Pemilik MB178',
        NULL::text
      )
  ) AS t(email, password_plain, display_name, store_slug) LOOP -- Skip if user already exists
  IF EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(u.email) = lower(rec.email)
  ) THEN CONTINUE;
END IF;
new_id := gen_random_uuid();
pwd_hash := crypt(rec.password_plain, gen_salt('bf'));
meta := jsonb_build_object('full_name', rec.display_name);
-- Insert auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    is_sso_user,
    is_anonymous
  )
VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    rec.email,
    pwd_hash,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    meta,
    now(),
    now(),
    '',
    '',
    '',
    '',
    now(),
    false,
    false
  );
-- Insert auth.identities
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
VALUES (
    gen_random_uuid(),
    new_id,
    jsonb_build_object(
      'sub',
      new_id::text,
      'email',
      rec.email,
      'email_verified',
      true,
      'phone_verified',
      false
    ),
    'email',
    rec.email,
    now(),
    now(),
    now()
  );
-- Insert store_memberships for owners
IF rec.store_slug IS NOT NULL THEN
INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT new_id,
  s.id,
  'owner'::public.store_role
FROM public.stores s
WHERE s.slug = rec.store_slug ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO
UPDATE
SET role = EXCLUDED.role;
END IF;
END LOOP;
END $$;
-- Super admin: one row per store (agar RLS has_store_role per store_id jalan)
INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT u.id,
  s.id,
  'super_admin'::public.store_role
FROM auth.users u
  CROSS JOIN public.stores s
WHERE lower(u.email) IN ('master@local.mb178', 'mb178@local.mb178') ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO
UPDATE
SET role = EXCLUDED.role;
-- Sync profiles for membership users
INSERT INTO public.profiles (id, full_name)
SELECT DISTINCT u.id,
  public.profile_display_name_from_user_meta(
    COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    u.email
  )
FROM auth.users u
  INNER JOIN public.store_memberships m ON m.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = u.id
  ) ON CONFLICT (id) DO NOTHING;
-- Update full_name from metadata
UPDATE public.profiles p
SET full_name = synced.full_name
FROM (
    SELECT DISTINCT u.id,
      public.profile_display_name_from_user_meta(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        u.email
      ) AS full_name
    FROM auth.users u
      INNER JOIN public.store_memberships m ON m.user_id = u.id
  ) AS synced
WHERE p.id = synced.id
  AND (
    p.full_name IS DISTINCT
    FROM synced.full_name
  );
-- =============================================================================
-- Verifikasi (opsional):
-- SELECT id, email, email_confirmed_at FROM auth.users WHERE email LIKE '%@local.mb178' ORDER BY email;
-- SELECT u.email, s.slug, m.role FROM public.store_memberships m JOIN auth.users u ON u.id = m.user_id JOIN public.stores s ON s.id = m.store_id ORDER BY u.email, s.slug;
-- =============================================================================