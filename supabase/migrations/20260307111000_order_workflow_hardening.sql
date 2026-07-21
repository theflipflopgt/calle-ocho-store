-- =============================================
-- ORDER WORKFLOW HARDENING (manual payments only)
-- - Atomic order creation in DB function
-- - Admin status transitions with audit trail
-- - Note persistence with metadata
-- - Restrict direct client writes on critical tables
-- =============================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notes_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  note TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
  ON public.order_status_history(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by
  ON public.order_status_history(changed_by, created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_status_history_user_read" ON public.order_status_history;
CREATE POLICY "order_status_history_user_read" ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_status_history_admin_all" ON public.order_status_history;
CREATE POLICY "order_status_history_admin_all" ON public.order_status_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Restrict direct writes from client on critical tables.
DROP POLICY IF EXISTS "orders_user_insert" ON public.orders;
DROP POLICY IF EXISTS "order_items_user_insert" ON public.order_items;
DROP POLICY IF EXISTS "payments_user_insert" ON public.payments;

CREATE OR REPLACE FUNCTION public.create_manual_order(
  p_shipping JSONB,
  p_customer_notes TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_has_items BOOLEAN := false;
  v_subtotal NUMERIC(10,2) := 0;
  v_shipping_cost NUMERIC(10,2) := 0;
  v_discount_amount NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_coupon RECORD;
  v_coupon_id UUID := NULL;
  v_coupon_code TEXT := NULL;
  v_user_coupon_uses INTEGER := 0;
  v_item RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF COALESCE(TRIM(p_shipping ->> 'recipientName'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'phone'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'streetAddress'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'city'), '') = ''
    OR COALESCE(TRIM(p_shipping ->> 'department'), '') = '' THEN
    RAISE EXCEPTION 'INVALID_SHIPPING';
  END IF;

  FOR v_item IN
    SELECT
      ci.variant_id,
      ci.quantity,
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
    FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.product_colors pc ON pc.id = pv.product_color_id
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
    WHERE ci.user_id = v_user_id
    FOR UPDATE OF pv
  LOOP
    v_has_items := true;

    IF v_item.quantity > v_item.stock_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_item.variant_id;
    END IF;

    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  END LOOP;

  IF NOT v_has_items THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  v_shipping_cost := CASE WHEN v_subtotal >= 1500 THEN 0 ELSE 35 END;

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

    SELECT COUNT(*)
    INTO v_user_coupon_uses
    FROM public.coupon_uses cu
    WHERE cu.coupon_id = v_coupon.id
      AND cu.user_id = v_user_id;

    IF v_coupon.max_uses_per_user IS NOT NULL
      AND v_user_coupon_uses >= v_coupon.max_uses_per_user THEN
      RAISE EXCEPTION 'COUPON_USER_LIMIT_REACHED';
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

  v_order_number :=
    'TFF-' || TO_CHAR(v_now, 'YYYYMMDDHH24MISS') || '-' ||
    UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 4));

  INSERT INTO public.orders (
    order_number,
    user_id,
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
    v_user_id,
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
      ci.variant_id,
      ci.quantity,
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
    FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.product_colors pc ON pc.id = pv.product_color_id
    JOIN public.products p ON p.id = pv.product_id
    LEFT JOIN public.brands b ON b.id = p.brand_id
    WHERE ci.user_id = v_user_id
    FOR UPDATE OF pv
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
    jsonb_build_object('mode', 'manual', 'created_from', 'checkout')
  );

  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE id = v_coupon_id;

    INSERT INTO public.coupon_uses (
      coupon_id,
      user_id,
      order_id
    )
    VALUES (
      v_coupon_id,
      v_user_id,
      v_order_id
    );
  END IF;

  DELETE FROM public.cart_items
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'subtotal', v_subtotal,
    'shippingCost', v_shipping_cost,
    'discountAmount', v_discount_amount,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_manual_order(JSONB, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_tracking_number TEXT DEFAULT NULL,
  p_tracking_url TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_now TIMESTAMPTZ := now();
  v_order RECORD;
  v_old_status TEXT;
BEGIN
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;

  IF p_new_status NOT IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  v_old_status := v_order.status;

  IF v_old_status <> p_new_status THEN
    IF NOT (
      (v_old_status = 'pending' AND p_new_status IN ('paid', 'processing', 'cancelled')) OR
      (v_old_status = 'paid' AND p_new_status IN ('processing', 'cancelled', 'refunded')) OR
      (v_old_status = 'processing' AND p_new_status IN ('shipped', 'cancelled', 'refunded')) OR
      (v_old_status = 'shipped' AND p_new_status IN ('delivered', 'refunded')) OR
      (v_old_status = 'delivered' AND p_new_status = 'refunded')
    ) THEN
      RAISE EXCEPTION 'INVALID_STATUS_TRANSITION:%->%', v_old_status, p_new_status;
    END IF;

    IF p_new_status IN ('cancelled', 'refunded')
      AND v_old_status NOT IN ('cancelled', 'refunded') THEN
      UPDATE public.product_variants pv
      SET stock_quantity = pv.stock_quantity + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
        AND oi.variant_id = pv.id;
    END IF;

    IF p_new_status = 'paid' THEN
      UPDATE public.payments
      SET status = 'completed',
          processed_at = COALESCE(processed_at, v_now),
          completed_at = COALESCE(completed_at, v_now)
      WHERE order_id = p_order_id
        AND status IN ('pending', 'processing');
    ELSIF p_new_status IN ('cancelled', 'refunded') THEN
      UPDATE public.payments
      SET status = CASE WHEN status = 'completed' THEN 'refunded' ELSE 'failed' END,
          failed_at = CASE WHEN status IN ('pending', 'processing') THEN COALESCE(failed_at, v_now) ELSE failed_at END,
          refunded_at = CASE WHEN status = 'completed' THEN COALESCE(refunded_at, v_now) ELSE refunded_at END
      WHERE order_id = p_order_id
        AND status NOT IN ('failed', 'refunded');
    END IF;
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      paid_at = CASE WHEN p_new_status = 'paid' THEN COALESCE(paid_at, v_now) ELSE paid_at END,
      shipped_at = CASE WHEN p_new_status = 'shipped' THEN COALESCE(shipped_at, v_now) ELSE shipped_at END,
      delivered_at = CASE WHEN p_new_status = 'delivered' THEN COALESCE(delivered_at, v_now) ELSE delivered_at END,
      cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN COALESCE(cancelled_at, v_now) ELSE cancelled_at END,
      tracking_number = CASE
        WHEN p_new_status = 'shipped' THEN NULLIF(TRIM(COALESCE(p_tracking_number, '')), '')
        ELSE tracking_number
      END,
      tracking_url = CASE
        WHEN p_new_status = 'shipped' THEN NULLIF(TRIM(COALESCE(p_tracking_url, '')), '')
        ELSE tracking_url
      END
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    note,
    metadata
  )
  VALUES (
    p_order_id,
    v_old_status,
    p_new_status,
    v_admin_id,
    NULLIF(TRIM(COALESCE(p_note, '')), ''),
    jsonb_build_object(
      'tracking_number', NULLIF(TRIM(COALESCE(p_tracking_number, '')), ''),
      'tracking_url', NULLIF(TRIM(COALESCE(p_tracking_url, '')), '')
    )
  );

  RETURN jsonb_build_object(
    'orderId', p_order_id,
    'fromStatus', v_old_status,
    'toStatus', p_new_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_order_notes(
  p_order_id UUID,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_now TIMESTAMPTZ := now();
  v_order RECORD;
BEGIN
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;

  UPDATE public.orders
  SET admin_notes = NULLIF(TRIM(COALESCE(p_notes, '')), ''),
      admin_notes_updated_at = v_now,
      admin_notes_updated_by = v_admin_id
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  RETURN jsonb_build_object(
    'orderId', v_order.id,
    'adminNotes', v_order.admin_notes,
    'updatedAt', v_order.admin_notes_updated_at,
    'updatedBy', v_order.admin_notes_updated_by
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_notes(UUID, TEXT) TO authenticated;
