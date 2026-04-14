-- Checkout atomik + status pesanan standar MB178.
-- Jalankan setelah setup-complete.sql dan migrasi 202604141031 / 033.
BEGIN;
COMMENT ON TABLE public.app_users IS 'LEGACY: tidak dipakai aplikasi untuk login. Autentikasi memakai auth.users + Supabase Auth. Tabel ini hanya untuk data historis / skrip migrasi lama.';
ALTER TABLE public.orders
ALTER COLUMN status
SET DEFAULT 'pending_payment';
-- Normalisasi nilai lama ke domain status baru
UPDATE public.orders
SET status = 'pending_payment'
WHERE status IN ('pending', 'pending_cod', 'pending_payment');
UPDATE public.orders
SET status = 'processing'
WHERE status IN ('booked', 'paid');
UPDATE public.orders
SET status = 'pending_payment'
WHERE status NOT IN (
    'pending_payment',
    'processing',
    'shipped',
    'completed',
    'cancelled'
  );
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'pending_payment',
      'processing',
      'shipped',
      'completed',
      'cancelled'
    )
  );
CREATE OR REPLACE FUNCTION public.mb178_checkout(
    p_store_id uuid,
    p_channel text,
    p_payment_method text,
    p_customer_name text,
    p_customer_phone text,
    p_notes text,
    p_items jsonb
  ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_order_id uuid;
v_total numeric(14, 2) := 0;
rec record;
v_price numeric(14, 2);
v_stock integer;
v_name text;
v_unit text;
v_store uuid;
v_line_total numeric(14, 2);
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
END IF;
IF p_items IS NULL
OR jsonb_typeof(p_items) != 'array'
OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'empty_cart' USING ERRCODE = '23514';
END IF;
-- Kunci & validasi baris + hitung total
FOR rec IN
SELECT agg.product_id,
  agg.qty
FROM (
    SELECT (elem->>'product_id')::uuid AS product_id,
      SUM((elem->>'qty')::numeric) AS qty
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY 1
  ) AS agg LOOP IF rec.qty IS NULL
  OR rec.qty <= 0
  OR rec.qty != trunc(rec.qty) THEN RAISE EXCEPTION 'invalid_qty' USING ERRCODE = '23514';
END IF;
SELECT p.price,
  p.stock,
  p.name,
  p.unit,
  p.store_id INTO v_price,
  v_stock,
  v_name,
  v_unit,
  v_store
FROM public.products p
WHERE p.id = rec.product_id FOR
UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found' USING ERRCODE = '23503';
END IF;
IF v_store IS DISTINCT
FROM p_store_id THEN RAISE EXCEPTION 'product_wrong_store' USING ERRCODE = '23514';
END IF;
IF v_stock < rec.qty::integer THEN RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = '23514';
END IF;
v_line_total := round(v_price * rec.qty, 2);
v_total := v_total + v_line_total;
END LOOP;
INSERT INTO public.orders (
    store_id,
    channel,
    payment_method,
    status,
    customer_name,
    customer_phone,
    notes,
    total,
    customer_id
  )
VALUES (
    p_store_id,
    COALESCE(NULLIF(trim(p_channel), ''), 'online'),
    COALESCE(NULLIF(trim(p_payment_method), ''), 'transfer'),
    'pending_payment',
    NULLIF(trim(p_customer_name), ''),
    NULLIF(trim(p_customer_phone), ''),
    NULLIF(trim(p_notes), ''),
    v_total,
    v_uid
  )
RETURNING id INTO v_order_id;
FOR rec IN
SELECT agg.product_id,
  agg.qty
FROM (
    SELECT (elem->>'product_id')::uuid AS product_id,
      SUM((elem->>'qty')::numeric) AS qty
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY 1
  ) AS agg LOOP
SELECT p.price,
  p.stock,
  p.name,
  p.unit INTO v_price,
  v_stock,
  v_name,
  v_unit
FROM public.products p
WHERE p.id = rec.product_id FOR
UPDATE;
v_line_total := round(v_price * rec.qty, 2);
INSERT INTO public.order_items (
    order_id,
    product_id,
    name_snapshot,
    unit_snapshot,
    price_snapshot,
    qty,
    line_total
  )
VALUES (
    v_order_id,
    rec.product_id,
    v_name,
    v_unit,
    v_price,
    rec.qty,
    v_line_total
  );
UPDATE public.products
SET stock = stock - rec.qty::integer
WHERE id = rec.product_id;
END LOOP;
RETURN v_order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.mb178_checkout(
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb
)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mb178_checkout(
    uuid,
    text,
    text,
    text,
    text,
    text,
    jsonb
  ) TO authenticated;
COMMIT;