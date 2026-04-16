-- ============================================================
-- Opsional: kolom phone di public.members + trigger sinkron dari metadata
-- Jalankan di Supabase SQL Editor setelah 03-members-display-name.sql.
-- ============================================================
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS phone text;
COMMENT ON COLUMN public.members.phone IS 'Nomor ternormalisasi digit 62… dari raw_user_meta_data saat signup; NULL untuk akun lama.';
CREATE UNIQUE INDEX IF NOT EXISTS members_phone_unique ON public.members (phone)
WHERE phone IS NOT NULL;
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
INSERT INTO public.members (id, display_name, phone)
VALUES (
    NEW.id,
    NULLIF(
      trim(
        COALESCE(
          NEW.raw_user_meta_data->>'display_name',
          NEW.raw_user_meta_data->>'full_name',
          ''
        )
      ),
      ''
    ),
    NULLIF(
      trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')),
      ''
    )
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;