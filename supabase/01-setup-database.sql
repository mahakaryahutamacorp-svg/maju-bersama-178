-- =============================================================================
-- Maju Bersama 178 (mahakaryahutama) — Database Setup Lengkap (Master)
-- =============================================================================
-- Jalankan di Supabase Dashboard → SQL Editor
-- Versi: 25 April 2026 (Consolidated)
-- =============================================================================

-- ============================================================
-- 1) Reset & Schema Setup
-- ============================================================
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT USAGE, CREATE ON SCHEMA public TO authenticated;

COMMENT ON SCHEMA public IS 'Maju Bersama 178 - mahakaryahutama (Production Schema)';

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon, authenticated;

-- ============================================================
-- 2) Enums & Tables
-- ============================================================

-- Enum store_role
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'store_role') THEN
        CREATE TYPE public.store_role AS ENUM ('customer', 'owner', 'super_admin');
    END IF;
END $$;

-- Tabel stores (Katalog Toko)
CREATE TABLE public.stores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    profile_image_url text,
    address text,
    whatsapp_link text,
    phone text,
    lat double precision,
    lng double precision,
    average_rating numeric(3, 2) NOT NULL DEFAULT 4.50,
    hide_zero_stock_from_catalog boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stores IS 'Katalog toko MB178; slug selaras public/toko_images/ & kode aplikasi.';

-- Tabel products (Produk Per Toko)
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    price numeric(14, 2) NOT NULL CHECK (price >= 0),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit text NOT NULL DEFAULT 'pcs',
    image_url text,
    description text,
    category text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_store_id_idx ON public.products(store_id);
CREATE INDEX products_category_idx ON public.products(category);

-- Tabel orders (Pesanan)
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text NOT NULL DEFAULT 'online',
    payment_method text NOT NULL DEFAULT 'transfer',
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'pending_payment', 'processing', 'shipped', 'completed', 'cancelled'
    customer_name text,
    customer_phone text,
    notes text,
    total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX orders_store_id_idx ON public.orders(store_id);

-- Tabel order_items (Detail Pesanan)
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    name_snapshot text NOT NULL,
    unit_snapshot text NOT NULL,
    price_snapshot numeric(14, 2) NOT NULL CHECK (price_snapshot >= 0),
    qty numeric(14, 3) NOT NULL CHECK (qty > 0),
    line_total numeric(14, 2) NOT NULL CHECK (line_total >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

-- Tabel banners (Slider Promosi)
CREATE TABLE public.banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url text NOT NULL,
    title text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabel members (1:1 auth.users) - Data Pelanggan & Identitas
CREATE TABLE public.members (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE,
    email text, -- Real email (aktif)
    display_name text,
    phone text,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.members IS 'Profil lengkap user (owner/customer); username untuk login id.';

-- Tabel products (Produk Per Toko)
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    price numeric(14, 2) NOT NULL CHECK (price >= 0),
    stock numeric(14, 3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit text NOT NULL DEFAULT 'pcs',
    image_url text,
    description text,
    category text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_store_id_idx ON public.products(store_id);
CREATE INDEX products_category_idx ON public.products(category);

-- Tabel orders (Pesanan)
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text NOT NULL DEFAULT 'online',
    payment_method text NOT NULL DEFAULT 'transfer',
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'pending_payment', 'processing', 'shipped', 'completed', 'cancelled'
    customer_name text,
    customer_phone text,
    notes text,
    total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX orders_store_id_idx ON public.orders(store_id);

-- Tabel order_items (Detail Pesanan)
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    name_snapshot text NOT NULL,
    unit_snapshot text NOT NULL,
    price_snapshot numeric(14, 2) NOT NULL CHECK (price_snapshot >= 0),
    qty numeric(14, 3) NOT NULL CHECK (qty > 0),
    line_total numeric(14, 2) NOT NULL CHECK (line_total >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

-- Tabel banners (Slider Promosi)
CREATE TABLE public.banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url text NOT NULL,
    title text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabel store_memberships (RBAC)
CREATE TABLE public.store_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    role public.store_role NOT NULL DEFAULT 'customer',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT store_memberships_unique_user_store UNIQUE (user_id, store_id)
);
CREATE INDEX store_memberships_user_id_idx ON public.store_memberships(user_id);
CREATE INDEX store_memberships_store_id_idx ON public.store_memberships(store_id);

-- ============================================================
-- 3) Functions & Triggers
-- ============================================================

-- Helper: Check Role
CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles public.store_role[])
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.store_memberships m
        WHERE m.user_id = auth.uid()
          AND m.store_id = p_store_id
          AND m.role = ANY(p_roles)
    );
$$;

-- Helper: Get Name from Metadata
CREATE OR REPLACE FUNCTION public.profile_display_name_from_user_meta(p_meta jsonb, p_email text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(trim(p_meta->>'full_name'), ''),
        NULLIF(trim(p_meta->>'name'), ''),
        NULLIF(trim(p_meta->>'display_name'), ''),
        NULLIF(trim(concat_ws(' ', p_meta->>'given_name', p_meta->>'family_name')), ''),
        NULLIF(trim(p_email), '')
    );
END;
$$;

-- Trigger: Handle New Auth User
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- Populate Members (Mapping for Login & Display)
    BEGIN
        INSERT INTO public.members (id, username, email, display_name, phone)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
            public.profile_display_name_from_user_meta(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb), NEW.email),
            NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '')
        ) 
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            phone = EXCLUDED.phone;
    EXCEPTION WHEN unique_violation THEN
        -- Jika username sudah dipakai ID lain, biarkan (tidak crash)
        NULL;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- 4) Views
-- ============================================================

-- View: Etalase Toko (digunakan untuk API Owner/Management)
CREATE OR REPLACE VIEW public.v_etalase_toko 
WITH (security_invoker = true)
AS
SELECT 
    p.*,
    s.name AS store_name,
    s.slug AS store_slug
FROM public.products p
JOIN public.stores s ON s.id = p.store_id;

-- ============================================================
-- 5) RLS Policies
-- ============================================================

-- Enforce RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Relaxed Security Policies (Testing Mode)
-- ============================================================

-- Stores: Public Read
CREATE POLICY "stores_read_all" ON public.stores FOR SELECT USING (true);

-- Products: Public Read, Owner Manage Own Store
CREATE POLICY "products_read_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_owner_manage" ON public.products FOR ALL TO authenticated 
USING (public.has_store_role(store_id, ARRAY['owner', 'super_admin']::public.store_role[]))
WITH CHECK (public.has_store_role(store_id, ARRAY['owner', 'super_admin']::public.store_role[]));

-- Banners: Public Read
CREATE POLICY "banners_read_all" ON public.banners FOR SELECT USING (true);

-- Members: Relaxed for testing (Authenticated can see all)
CREATE POLICY "members_read_all" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_own_manage" ON public.members FOR ALL TO authenticated USING (id = auth.uid());

-- Memberships: Own or Store Owner
CREATE POLICY "memberships_read_access" ON public.store_memberships FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR public.has_store_role(store_id, ARRAY['owner', 'super_admin']::public.store_role[]));

-- Orders: Owner sees store data, Customer sees own
CREATE POLICY "orders_access" ON public.orders FOR SELECT TO authenticated 
USING (customer_id = auth.uid() OR public.has_store_role(store_id, ARRAY['owner', 'super_admin']::public.store_role[]));

CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());

-- Order Items: Follow Order Access
CREATE POLICY "order_items_access" ON public.order_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.has_store_role(o.store_id, ARRAY['owner', 'super_admin']::public.store_role[])))
);

-- ============================================================
-- 6) Checkout RPC (Atomic)
-- ============================================================

CREATE OR REPLACE FUNCTION public.mb178_checkout(
    p_customer_id uuid,
    p_store_id uuid,
    p_channel text,
    p_payment_method text,
    p_customer_name text,
    p_customer_phone text,
    p_notes text,
    p_items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
    v_order_id uuid;
    r jsonb;
    v_product_id uuid;
    v_qty numeric;
    v_name text;
    v_unit text;
    v_price numeric;
    v_stock numeric;
    v_total numeric := 0;
BEGIN
    IF p_customer_id IS NULL THEN RAISE EXCEPTION 'customer_id required'; END IF;
    IF p_store_id IS NULL THEN RAISE EXCEPTION 'store_id required'; END IF;
    
    -- Calculate total & validate stock
    FOR r IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (r->>'product_id')::uuid;
        v_qty := (r->>'qty')::numeric;
        
        SELECT name, unit, price, stock INTO v_name, v_unit, v_price, v_stock
        FROM public.products WHERE id = v_product_id AND store_id = p_store_id FOR UPDATE;
        
        IF NOT FOUND THEN RAISE EXCEPTION 'Product % not found in store', v_product_id; END IF;
        IF v_stock < v_qty THEN RAISE EXCEPTION 'Insufficient stock for % (requested %, available %)', v_name, v_qty, v_stock; END IF;
        
        v_total := v_total + (v_price * v_qty);
    END LOOP;

    -- Create Order
    INSERT INTO public.orders (store_id, customer_id, channel, payment_method, customer_name, customer_phone, notes, total)
    VALUES (p_store_id, p_customer_id, p_channel, p_payment_method, p_customer_name, p_customer_phone, p_notes, v_total)
    RETURNING id INTO v_order_id;

    -- Create Items & Decrement Stock
    FOR r IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (r->>'product_id')::uuid;
        v_qty := (r->>'qty')::numeric;
        
        SELECT name, unit, price INTO v_name, v_unit, v_price
        FROM public.products WHERE id = v_product_id;

        INSERT INTO public.order_items (order_id, product_id, name_snapshot, unit_snapshot, price_snapshot, qty, line_total)
        VALUES (v_order_id, v_product_id, v_name, v_unit, v_price, v_qty, v_price * v_qty);
        
        UPDATE public.products SET stock = stock - v_qty WHERE id = v_product_id;
    END LOOP;

    RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb) TO service_role;

-- ============================================================
-- 7) Seed Data: 8 Toko Kanonis
-- ============================================================

INSERT INTO public.stores (slug, name, address, whatsapp_link, phone, lat, lng, created_at)
VALUES 
('pupuk-majubersama', 'Maju Bersama Pupuk & Alat Pertanian', 'Jl. nusa indah ujung bk10 belitang okutimur sumatra selatan', 'https://wa.me/6282175858585', '082175858585', -6.2088, 106.8456, '2026-01-01 00:00:01+07'),
('rosaura-skin-clinic', 'Rosaura Skin Clinic', 'Jl. pasar sidodadi bk9 belitang okutimur sumatra selatan', 'https://wa.me/6285235147777', '085235147777', -6.1954, 106.8232, '2026-01-01 00:00:02+07'),
('raniah-travel', 'Raniah Travel Umroh dan Haji', 'Jl. nusa indah ujung bk10 belitang okutimur sumatra selatan', 'https://wa.me/6282175858585', '082175858585', -7.2575, 112.7521, '2026-01-01 00:00:03+07'),
('pakan-pei', 'Pakan PE''I Maju Bersama', 'Jl. nusa indah ujung bk10 belitang okutimur sumatra selatan', 'https://wa.me/6282175858585', '082175858585', -6.2146, 106.8451, '2026-01-01 00:00:04+07'),
('drg-sona', 'Klinik drg. Sona', 'Jl. puncak 5 bk 10', 'https://wa.me/6282175858585', '082175858585', -6.9175, 107.6191, '2026-01-01 00:00:05+07'),
('rocell-gadget', 'Rocell Gadget', 'Jl. pasar sidodadi bk9 belitang okutimur sumatra selatan', 'https://wa.me/6281300006666', '081300006666', 3.5952, 98.6722, '2026-01-01 00:00:06+07'),
('pestisida-mbp', 'Pestisida Maju Bersama', 'Jl. nusa indah ujung bk10 belitang okutimur sumatra selatan', 'https://wa.me/6282175858585', '082175858585', -6.2416, 106.9926, '2026-01-01 00:00:07+07'),
('dapurku-seafood', 'Restoran Seafood Dapurku by Chef Hendra', 'Jl. raya bk10 sebelah STIE okutimur sumatra selatan', 'https://wa.me/6282175858585', '082175858585', -6.9932, 110.4203, '2026-01-01 00:00:08+07')
ON CONFLICT (slug) DO NOTHING;

-- Seed Banners
INSERT INTO public.banners (image_url, title, is_active)
VALUES 
('/banners/banners01.jpg', 'Promo 1', true),
('/banners/banners02.jpg', 'Promo 2', true),
('/banners/banners03.jpg', 'Promo 3', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Done! 
-- ============================================================