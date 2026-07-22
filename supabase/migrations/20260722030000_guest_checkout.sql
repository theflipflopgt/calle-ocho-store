-- Guest checkout support.
-- Keeps authenticated checkout intact and adds secure lookup for guest orders.

ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS guest_access_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_guest_access_token
  ON public.orders(guest_access_token)
  WHERE guest_access_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_guest_lookup
  ON public.orders(order_number, guest_email)
  WHERE guest_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_guest_manual_order(
  p_customer_email TEXT,
  p_shipping JSONB,
  p_items JSONB,
  p_customer_notes TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_access_token TEXT;
  v_subtotal NUMERIC(10,2) := 0;
  v_shipping_cost NUMERIC(10,2) := 0;
  v_discount_amount NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_coupon RECORD;
  v_coupon_id UUID := NULL;
  v_coupon_code TEXT := NULL;
  v_item RECORD;
  v_now TIMESTAMPTZ := now();
  v_customer_email TEXT := LOWER(TRIM(COALESCE(p_customer_email, '')));
BEGIN
  IF v_customer_email = ''
    OR v_customer_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    OR LENGTH(v_customer_email) > 254 THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  IF COALESCE(TRIM(p_shipping ->> 'recipientName'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'phone'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'streetAddress'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'city'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'department'), '') = '' THEN
    RAISE EXCEPTION 'INVALID_SHIPPING';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_guest_order_items (
    variant_id UUID PRIMARY KEY,
    quantity INTEGER NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE tmp_guest_order_items;

  INSERT INTO tmp_guest_order_items (variant_id, quantity)
  SELECT
    (item ->> 'variantId')::UUID,
    SUM((item ->> 'quantity')::INTEGER)::INTEGER
  FROM jsonb_array_elements(p_items) AS item
  WHERE COALESCE(item ->> 'variantId', '') <> ''
    AND COALESCE(item ->> 'quantity', '') <> ''
  GROUP BY (item ->> 'variantId')::UUID;

  IF NOT EXISTS (SELECT 1 FROM tmp_guest_order_items) THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tmp_guest_order_items
    WHERE quantity < 1 OR quantity > 20
  ) THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  FOR v_item IN
    SELECT
      t.variant_id,
      t.quantity,
      pv.stock_quantity,
      pv.sku,
      pv.size_us,
      pv.size_eu,
      pv.size_uk,
      pv.size_cm,
      pc.id AS product_color_id,
      pc.color_name,
      p.name AS product_name,
      b.name AS brand_name,
      COALESCE(pv.price_override, p.base_price) AS unit_price,
      (
        SELECT pci.image_url
        FROM public.product_color_images pci
        WHERE pci.product_color_id = pc.id
        ORDER BY pci.display_order ASC, pci.created_at ASC
        LIMIT 1
      ) AS product_image_url
    FROM tmp_guest_order_items t
    JOIN public.product_variants pv ON pv.id = t.variant_id
    JOIN public.product_colors pc ON pc.id = pv.product_color_id
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
    WHERE pv.is_available = true
      AND p.status = 'active'
    FOR UPDATE OF pv
  LOOP
    IF v_item.quantity > v_item.stock_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_item.variant_id;
    END IF;

    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  END LOOP;

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  v_shipping_cost := CASE WHEN v_subtotal >= 1000 THEN 0 ELSE 35 END;

  IF p_coupon_code IS NOT NULL AND LENGTH(TRIM(p_coupon_code)) > 0 THEN
    SELECT *
    INTO v_coupon
    FROM public.coupons c
    WHERE UPPER(c.code) = UPPER(TRIM(p_coupon_code))
      AND c.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_COUPON';
    END IF;

    IF v_now < v_coupon.valid_from THEN
      RAISE EXCEPTION 'COUPON_NOT_STARTED';
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_now > v_coupon.valid_until THEN
      RAISE EXCEPTION 'COUPON_EXPIRED';
    END IF;

    IF v_coupon.max_uses IS NOT NULL
      AND COALESCE(v_coupon.current_uses, 0) >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'COUPON_LIMIT_REACHED';
    END IF;

    IF v_coupon.min_purchase_amount IS NOT NULL
      AND v_subtotal < v_coupon.min_purchase_amount THEN
      RAISE EXCEPTION 'COUPON_MIN_PURCHASE_NOT_MET';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount_amount := ROUND((v_subtotal * v_coupon.discount_value / 100)::NUMERIC, 2);

      IF v_coupon.max_discount_amount IS NOT NULL THEN
        v_discount_amount := LEAST(v_discount_amount, v_coupon.max_discount_amount);
      END IF;
    ELSE
      v_discount_amount := LEAST(v_coupon.discount_value, v_subtotal);
    END IF;

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;
  END IF;

  v_total := GREATEST(v_subtotal + v_shipping_cost - v_discount_amount, 0);
  v_access_token := REPLACE(gen_random_uuid()::TEXT, '-', '') || REPLACE(gen_random_uuid()::TEXT, '-', '');
  v_order_number :=
    'TFF-' || TO_CHAR(v_now, 'YYYYMMDDHH24MISS') || '-' ||
    UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 4));

  INSERT INTO public.orders (
    order_number,
    user_id,
    guest_email,
    guest_phone,
    guest_access_token,
    shipping_recipient_name,
    shipping_phone,
    shipping_street_address,
    shipping_zone,
    shipping_neighborhood,
    shipping_city,
    shipping_department,
    shipping_postal_code,
    shipping_country,
    shipping_additional_references,
    subtotal,
    shipping_cost,
    tax_amount,
    discount_amount,
    total,
    coupon_id,
    coupon_code,
    coupon_discount,
    status,
    customer_notes
  )
  VALUES (
    v_order_number,
    NULL,
    v_customer_email,
    TRIM(p_shipping ->> 'phone'),
    v_access_token,
    TRIM(p_shipping ->> 'recipientName'),
    TRIM(p_shipping ->> 'phone'),
    TRIM(p_shipping ->> 'streetAddress'),
    NULLIF(TRIM(COALESCE(p_shipping ->> 'zone', '')), ''),
    NULLIF(TRIM(COALESCE(p_shipping ->> 'neighborhood', '')), ''),
    TRIM(p_shipping ->> 'city'),
    TRIM(p_shipping ->> 'department'),
    NULLIF(TRIM(COALESCE(p_shipping ->> 'postalCode', '')), ''),
    'Guatemala',
    NULLIF(TRIM(COALESCE(p_shipping ->> 'additionalReferences', '')), ''),
    v_subtotal,
    v_shipping_cost,
    0,
    v_discount_amount,
    v_total,
    v_coupon_id,
    v_coupon_code,
    v_discount_amount,
    'pending',
    NULLIF(TRIM(COALESCE(p_customer_notes, '')), '')
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT
      t.variant_id,
      t.quantity,
      pv.sku,
      pv.size_us,
      pv.size_eu,
      pv.size_uk,
      pv.size_cm,
      pc.color_name,
      p.name AS product_name,
      b.name AS brand_name,
      COALESCE(pv.price_override, p.base_price) AS unit_price,
      (
        SELECT pci.image_url
        FROM public.product_color_images pci
        WHERE pci.product_color_id = pc.id
        ORDER BY pci.display_order ASC, pci.created_at ASC
        LIMIT 1
      ) AS product_image_url
    FROM tmp_guest_order_items t
    JOIN public.product_variants pv ON pv.id = t.variant_id
    JOIN public.product_colors pc ON pc.id = pv.product_color_id
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
  LOOP
    INSERT INTO public.order_items (
      order_id,
      variant_id,
      product_name,
      product_sku,
      brand_name,
      color_name,
      size_us,
      size_eu,
      size_uk,
      size_cm,
      unit_price,
      quantity,
      subtotal,
      product_image_url
    )
    VALUES (
      v_order_id,
      v_item.variant_id,
      v_item.product_name,
      v_item.sku,
      COALESCE(v_item.brand_name, 'Sin marca'),
      v_item.color_name,
      v_item.size_us,
      v_item.size_eu,
      v_item.size_uk,
      v_item.size_cm,
      v_item.unit_price,
      v_item.quantity,
      v_item.unit_price * v_item.quantity,
      v_item.product_image_url
    );

    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_item.variant_id;
  END LOOP;

  INSERT INTO public.payments (
    order_id,
    payment_method,
    amount,
    status,
    payment_details
  )
  VALUES (
    v_order_id,
    'cash_on_delivery',
    v_total,
    'pending',
    jsonb_build_object('mode', 'manual', 'created_from', 'guest_checkout')
  );

  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE id = v_coupon_id;
  END IF;

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'accessToken', v_access_token,
    'subtotal', v_subtotal,
    'shippingCost', v_shipping_cost,
    'discountAmount', v_discount_amount,
    'total', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_manual_order(TEXT, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_manual_order(TEXT, JSONB, JSONB, TEXT, TEXT) TO service_role;
