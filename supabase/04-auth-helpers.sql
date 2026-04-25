-- =============================================================================
-- Maju Bersama 178 (mahakaryahutama) — Auth Helpers & RPCs
-- =============================================================================
-- Jalankan di Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1) Get Email from Username (untuk Login)
-- Digunakan frontend: masukkan username -> dapatkan email -> panggil auth.signIn
CREATE OR REPLACE FUNCTION public.get_email_from_username(p_username text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_email text;
BEGIN
    SELECT email INTO v_email
    FROM public.members
    WHERE lower(username) = lower(p_username)
    LIMIT 1;

    RETURN v_email;
END;
$$;

-- 2) Register Customer RPC (Simplified)
-- Memastikan username unik dan mapping email terjaga
CREATE OR REPLACE FUNCTION public.register_customer(
    p_username text,
    p_email text,
    p_password text,
    p_display_name text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if username exists
    IF EXISTS (SELECT 1 FROM public.members WHERE lower(username) = lower(p_username)) THEN
        RAISE EXCEPTION 'Username sudah digunakan';
    END IF;

    -- Note: register_customer ini hanya menyiapkan data di public.members
    -- Untuk pendaftaran auth sesungguhnya, tetap gunakan supabase.auth.signUp
    -- Fungsi ini lebih untuk dokumentasi atau pembersihan data jika diperlukan.
    
    RETURN NULL;
END;
$$;

-- Grant access to RPC
GRANT EXECUTE ON FUNCTION public.get_email_from_username(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_email_from_username IS 'Mendapatkan email asli berdasarkan username/id untuk login.';
