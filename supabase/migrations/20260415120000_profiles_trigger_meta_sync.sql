-- Perkaya handle_new_auth_user: full_name dari auth.users.raw_user_meta_data (+ fallback).
-- Sinkronkan public.profiles untuk setiap user yang punya baris di public.store_memberships.
BEGIN;
CREATE OR REPLACE FUNCTION public.profile_display_name_from_user_meta(p_meta jsonb, p_email text) RETURNS text LANGUAGE sql IMMUTABLE
SET search_path = public AS $$
SELECT COALESCE(
    NULLIF(trim(p_meta->>'full_name'), ''),
    NULLIF(trim(p_meta->>'name'), ''),
    NULLIF(trim(p_meta->>'display_name'), ''),
    NULLIF(
      trim(
        concat_ws(
          ' ',
          NULLIF(trim(p_meta->>'given_name'), ''),
          NULLIF(trim(p_meta->>'family_name'), '')
        )
      ),
      ''
    ),
    NULLIF(trim(p_email), '')
  );
$$;
COMMENT ON FUNCTION public.profile_display_name_from_user_meta(jsonb, text) IS 'Nama tampilan profil: prioritas raw_user_meta_data (full_name, name, display_name, given_name+family_name), lalu email.';
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (
    NEW.id,
    public.profile_display_name_from_user_meta(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      NEW.email
    )
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Trigger auth.users INSERT: isi public.profiles dari raw_user_meta_data (lihat profile_display_name_from_user_meta).';
-- Pastikan profil ada + full_name selaras dengan metadata Auth untuk pemilik membership
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
COMMIT;