-- RLS hardening for Auth-native multi-tenant access
-- Goals:
-- - profiles: user can read/update own profile
-- - store_memberships: user can read own memberships; only service_role can write
-- - orders/order_items: customer can access own orders; owner/super_admin can access store orders
-- - remove any wide-open policies left from initial setup scripts
BEGIN;
-- Grants (explicit, avoids relying on default privileges)
GRANT SELECT,
  UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.store_memberships TO authenticated;
GRANT SELECT,
  INSERT,
  UPDATE ON public.orders TO authenticated;
GRANT SELECT,
  INSERT ON public.order_items TO authenticated;
-- Ensure RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
-- Helper: check membership role for a store (read-only, safe under RLS usage)
CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles public.store_role []) RETURNS boolean LANGUAGE sql STABLE
SET search_path = public AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.store_memberships m
    WHERE m.user_id = auth.uid()
      AND m.store_id = p_store_id
      AND m.role = ANY (p_roles)
  );
$$;
-- -------------------------
-- profiles policies
-- -------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_block" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_block" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR
SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- block client inserts/deletes (handled by trigger/service role)
CREATE POLICY "profiles_insert_block" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "profiles_delete_block" ON public.profiles FOR DELETE TO authenticated USING (false);
-- -------------------------
-- store_memberships policies
-- -------------------------
DROP POLICY IF EXISTS "store_memberships_select_own" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_insert_block" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_update_block" ON public.store_memberships;
DROP POLICY IF EXISTS "store_memberships_delete_block" ON public.store_memberships;
CREATE POLICY "store_memberships_select_own" ON public.store_memberships FOR
SELECT TO authenticated USING (user_id = auth.uid());
-- No client writes to membership table (admin/server only)
CREATE POLICY "store_memberships_insert_block" ON public.store_memberships FOR
INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "store_memberships_update_block" ON public.store_memberships FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "store_memberships_delete_block" ON public.store_memberships FOR DELETE TO authenticated USING (false);
-- -------------------------
-- orders policies
-- -------------------------
-- Remove dangerous legacy policies if they exist.
DROP POLICY IF EXISTS "orders_select_all" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_all" ON public.order_items;
DROP POLICY IF EXISTS "orders_select_customer_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner_store" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_customer_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_owner_store" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_block" ON public.orders;
-- Customer can read own orders
CREATE POLICY "orders_select_customer_own" ON public.orders FOR
SELECT TO authenticated USING (customer_id = auth.uid());
-- Owner/super_admin can read orders for stores they manage
CREATE POLICY "orders_select_owner_store" ON public.orders FOR
SELECT TO authenticated USING (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  );
-- Customer can create own orders (must set customer_id=auth.uid())
CREATE POLICY "orders_insert_customer_own" ON public.orders FOR
INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
-- Owner/super_admin can update orders in their store (e.g. status)
CREATE POLICY "orders_update_owner_store" ON public.orders FOR
UPDATE TO authenticated USING (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  ) WITH CHECK (
    public.has_store_role(
      store_id,
      ARRAY ['owner', 'super_admin']::public.store_role []
    )
  );
-- Block deletes from client (server-only)
CREATE POLICY "orders_delete_block" ON public.orders FOR DELETE TO authenticated USING (false);
-- -------------------------
-- order_items policies
-- -------------------------
DROP POLICY IF EXISTS "order_items_select_customer_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_owner_store" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_customer_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_block" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_block" ON public.order_items;
-- Customer can read items for own orders
CREATE POLICY "order_items_select_customer_own" ON public.order_items FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );
-- Owner/super_admin can read items for store orders they manage
CREATE POLICY "order_items_select_owner_store" ON public.order_items FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND public.has_store_role(
          o.store_id,
          ARRAY ['owner', 'super_admin']::public.store_role []
        )
    )
  );
-- Customer can insert order items only for orders they own
CREATE POLICY "order_items_insert_customer_own" ON public.order_items FOR
INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
    )
  );
-- No client updates/deletes of items (server-only)
CREATE POLICY "order_items_update_block" ON public.order_items FOR
UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "order_items_delete_block" ON public.order_items FOR DELETE TO authenticated USING (false);
COMMIT;