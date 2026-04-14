-- Auth-native multi-tenant schema for MB178
-- This migration introduces:
-- - public.profiles (1:1 with auth.users)
-- - public.store_memberships (user<->store roles)
-- - orders.customer_id for customer-owned orders
-- - helper functions + trigger to auto-provision profiles
BEGIN;
-- 1) Profiles (one per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- 2) Store memberships
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname = 'store_role'
) THEN CREATE TYPE public.store_role AS ENUM ('customer', 'owner', 'super_admin');
END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.store_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  role public.store_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_memberships_unique_user_store UNIQUE (user_id, store_id)
);
CREATE INDEX IF NOT EXISTS store_memberships_user_id_idx ON public.store_memberships (user_id);
CREATE INDEX IF NOT EXISTS store_memberships_store_id_idx ON public.store_memberships (store_id);
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
-- 3) Orders: attach customer identity
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users (id) ON DELETE
SET NULL;
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders (customer_id);
-- 4) Provisioning: create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
COMMIT;