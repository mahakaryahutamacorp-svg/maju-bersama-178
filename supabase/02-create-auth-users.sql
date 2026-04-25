-- =============================================================================
-- Maju Bersama 178 (mahakaryahutama) — Create Auth Users & Memberships
-- =============================================================================
-- Jalankan SETELAH 01-setup-database.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE 
    rec record;
    new_id uuid;
    pwd_hash text;
    meta jsonb;
BEGIN 
    FOR rec IN
        SELECT * FROM (
            VALUES 
                ('pupuk01@mb178.online', '223344', 'Owner Pupuk & Alat', 'pupuk-majubersama'),
                ('pesti02@mb178.online', '223344', 'Owner Pestisida', 'pestisida-mbp'),
                ('pakan03@mb178.online', '223344', 'Owner Pakan PEI', 'pakan-pei'),
                ('gita04@mb178.online', '223344', 'Owner Rosaura Clinic', 'rosaura-skin-clinic'),
                ('sona05@mb178.online', '223344', 'Owner Klinik drg. Sona', 'drg-sona'),
                ('raniah06@mb178.online', '223344', 'Owner Raniah Travel', 'raniah-travel'),
                ('dapurku07@mb178.online', '223344', 'Owner Dapurku Seafood', 'dapurku-seafood'),
                ('rocell08@mb178.online', '223344', 'Owner Rocell Gadget', 'rocell-gadget'),
                ('master@mb178.online', '178178', 'Master Admin', NULL::text)
        ) AS t(email, password_plain, display_name, store_slug) 
    LOOP
        -- Skip if email already exists
        IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(rec.email)) THEN 
            CONTINUE; 
        END IF;

        -- Skip if username already exists in public.members (to avoid trigger crash)
        IF EXISTS (SELECT 1 FROM public.members m WHERE lower(m.username) = lower(split_part(rec.email, '@', 1))) THEN
            CONTINUE;
        END IF;

        new_id := gen_random_uuid();
        pwd_hash := crypt(rec.password_plain, gen_salt('bf'));
        meta := jsonb_build_object('full_name', rec.display_name);

        -- Insert auth.users
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, confirmation_token, recovery_token, 
            email_change_token_new, email_change, last_sign_in_at, 
            is_sso_user, is_anonymous
        )
        VALUES (
            new_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 
            rec.email, pwd_hash, now(), '{"provider":"email","providers":["email"]}'::jsonb, 
            meta, now(), now(), '', '', '', '', now(), false, false
        );

        -- Insert auth.identities
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, 
            last_sign_in_at, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(), new_id, 
            jsonb_build_object('sub', new_id::text, 'email', rec.email, 'email_verified', true, 'phone_verified', false),
            'email', rec.email, now(), now(), now()
        );

        -- Insert store_memberships for owners
        IF rec.store_slug IS NOT NULL THEN
            INSERT INTO public.store_memberships (user_id, store_id, role)
            SELECT new_id, s.id, 'owner'::public.store_role
            FROM public.stores s WHERE s.slug = rec.store_slug
            ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO UPDATE SET role = EXCLUDED.role;
        END IF;
    END LOOP;
END $$;

-- Super admin: access to ALL stores
INSERT INTO public.store_memberships (user_id, store_id, role)
SELECT u.id, s.id, 'super_admin'::public.store_role
FROM auth.users u CROSS JOIN public.stores s
WHERE lower(u.email) IN ('master178@local.mb178')
ON CONFLICT ON CONSTRAINT store_memberships_unique_user_store DO UPDATE SET role = EXCLUDED.role;

-- Sync profiles
INSERT INTO public.profiles (id, full_name)
SELECT u.id, public.profile_display_name_from_user_meta(u.raw_user_meta_data, u.email)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;