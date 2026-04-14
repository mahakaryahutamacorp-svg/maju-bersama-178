-- Atomic checkout: one order + order_items + stock decrement (single transaction).
-- Invoked only with service_role from trusted Server Action after session verification.
BEGIN;

CREATE OR REPLACE FUNCTION public.mb178_checkout(
  p_customer_id uuid,
  p_store_id uuid,
  p_channel text,
  p_payment_method text,
  p_customer_name text,
  p_customer_phone text,
  p_notes text,
  p_items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_order_id uuid;
  r jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_name text;
  v_unit text;
  v_price numeric;
  v_stock integer;
  v_line_total numeric;
  v_total numeric := 0;
BEGIN
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id required';
  END IF;
  IF p_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id required';
  END IF;
  IF jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'empty cart';
  END IF;

  -- Validate lines, lock rows (product_id order), compute total
  FOR r IN
  SELECT
    value
  FROM
    jsonb_array_elements(p_items) AS t(value)
  ORDER BY
    (value ->> 'product_id')
  LOOP
    v_product_id := (r ->> 'product_id')::uuid;
    v_qty := (r ->> 'qty')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty <> trunc(v_qty) THEN
      RAISE EXCEPTION 'invalid qty for product %', v_product_id;
    END IF;
    SELECT
      p.name,
      p.unit,
      p.price,
      p.stock INTO v_name,
      v_unit,
      v_price,
      v_stock
    FROM
      public.products p
    WHERE
      p.id = v_product_id
      AND p.store_id = p_store_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'product % not in store', v_product_id;
    END IF;
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'insufficient stock for product %', v_product_id;
    END IF;
    v_line_total := round(v_price * v_qty, 2);
    v_total := v_total + v_line_total;
  END LOOP;

  INSERT INTO public.orders (
      store_id,
      channel,
      payment_method,
      status,
      customer_id,
      customer_name,
      customer_phone,
      notes,
      total
    )
  VALUES (
      p_store_id,
      coalesce(nullif(trim(p_channel), ''), 'online'),
      coalesce(nullif(trim(p_payment_method), ''), 'transfer'),
      'pending',
      p_customer_id,
      nullif(trim(p_customer_name), ''),
      nullif(trim(p_customer_phone), ''),
      nullif(trim(p_notes), ''),
      v_total
    )
  RETURNING
    id INTO v_order_id;

  FOR r IN
  SELECT
    value
  FROM
    jsonb_array_elements(p_items) AS t(value)
  ORDER BY
    (value ->> 'product_id')
  LOOP
    v_product_id := (r ->> 'product_id')::uuid;
    v_qty := (r ->> 'qty')::numeric;
    SELECT
      p.name,
      p.unit,
      p.price,
      p.stock INTO v_name,
      v_unit,
      v_price,
      v_stock
    FROM
      public.products p
    WHERE
      p.id = v_product_id
      AND p.store_id = p_store_id
    FOR UPDATE;
    v_line_total := round(v_price * v_qty, 2);
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
        v_product_id,
        v_name,
        v_unit,
        v_price,
        v_qty,
        v_line_total
      );
    UPDATE
      public.products
    SET
      stock = stock - v_qty::integer
    WHERE
      id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mb178_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mb178_checkout(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb
) TO service_role;

COMMENT ON FUNCTION public.mb178_checkout(uuid, uuid, text, text, text, text, text, jsonb) IS 'Atomic checkout: insert order + order_items and decrement stock. Invoke only from trusted server (service_role).';

COMMIT;
