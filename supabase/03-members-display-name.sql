-- ============================================================
-- Tabel public.members (1:1 auth.users) — display_name opsional
-- Jalankan setelah 00-setup-database.sql.
-- Jika Anda sudah membuat tabel dengan kolom lain (mis. user_id),
-- sesuaikan INSERT di handle_new_auth_user dan policy di bawah.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.members IS 'Profil ringkas pelanggan; display_name boleh NULL.';
COMMENT ON COLUMN public.members.display_name IS 'Nama tampilan opsional; kosongkan jika tidak diisi saat daftar.';
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
GRANT SELECT,
  UPDATE ON public.members TO authenticated;
DROP POLICY IF EXISTS "members_select_own" ON public.members;
DROP POLICY IF EXISTS "members_update_own" ON public.members;
DROP POLICY IF EXISTS "members_insert_block" ON public.members;
CREATE POLICY "members_select_own" ON public.members FOR
SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "members_update_own" ON public.members FOR
UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "members_insert_block" ON public.members FOR
INSERT TO authenticated WITH CHECK (false);
-- Trigger: baris members dibuat otomatis; display_name hanya dari meta jika diisi
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
INSERT INTO public.members (id, display_name)
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
    )
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;