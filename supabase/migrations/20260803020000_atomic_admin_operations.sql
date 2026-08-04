-- Atomic order administration and staff authorization.

DROP POLICY IF EXISTS "order_status_history_staff_all" ON public.order_status_history;
DROP POLICY IF EXISTS "order_status_history_admin_read" ON public.order_status_history;
CREATE POLICY "order_status_history_admin_read" ON public.order_status_history
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
DROP POLICY IF EXISTS "order_status_history_seller_assigned_read" ON public.order_status_history;
CREATE POLICY "order_status_history_seller_assigned_read" ON public.order_status_history
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.seller_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'seller')
  )
);

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
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_now TIMESTAMPTZ := now();
  v_order RECORD;
  v_old_status TEXT;
BEGIN
  IF v_actor_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  IF v_role NOT IN ('admin', 'seller') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;

  IF p_new_status NOT IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_role = 'seller' AND v_order.seller_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'ORDER_NOT_ASSIGNED';
  END IF;

  v_old_status := v_order.status;
  IF v_old_status <> p_new_status THEN
    IF NOT (
      (v_old_status = 'pending' AND p_new_status IN ('paid', 'cancelled')) OR
      (v_old_status = 'paid' AND p_new_status IN ('processing', 'cancelled', 'refunded')) OR
      (v_old_status = 'processing' AND p_new_status IN ('shipped', 'cancelled', 'refunded')) OR
      (v_old_status = 'shipped' AND p_new_status IN ('delivered', 'refunded')) OR
      (v_old_status = 'delivered' AND p_new_status = 'refunded')
    ) THEN
      RAISE EXCEPTION 'INVALID_STATUS_TRANSITION:%->%', v_old_status, p_new_status;
    END IF;

    IF p_new_status IN ('cancelled', 'refunded') THEN
      PERFORM public.release_order_inventory(
        p_order_id,
        CASE WHEN p_new_status = 'refunded' THEN 'refund' ELSE 'cancellation' END,
        COALESCE(NULLIF(trim(p_note), ''), 'Cambio de estado administrativo'),
        v_actor_id
      );
    END IF;

    IF p_new_status = 'paid' THEN
      UPDATE public.payments SET
        status = 'completed',
        processed_at = COALESCE(processed_at, v_now),
        completed_at = COALESCE(completed_at, v_now),
        updated_at = v_now
      WHERE order_id = p_order_id AND status IN ('pending', 'processing');
    ELSIF p_new_status IN ('cancelled', 'refunded') THEN
      UPDATE public.payments SET
        status = CASE WHEN status = 'completed' THEN 'refunded' ELSE 'failed' END,
        failed_at = CASE WHEN status IN ('pending', 'processing') THEN COALESCE(failed_at, v_now) ELSE failed_at END,
        refunded_at = CASE WHEN status = 'completed' THEN COALESCE(refunded_at, v_now) ELSE refunded_at END,
        failure_reason = CASE WHEN status IN ('pending', 'processing') THEN upper(p_new_status) ELSE failure_reason END,
        updated_at = v_now
      WHERE order_id = p_order_id AND status NOT IN ('failed', 'refunded');
    END IF;
  END IF;

  UPDATE public.orders SET
    status = p_new_status,
    paid_at = CASE WHEN p_new_status = 'paid' THEN COALESCE(paid_at, v_now) ELSE paid_at END,
    shipped_at = CASE WHEN p_new_status = 'shipped' THEN COALESCE(shipped_at, v_now) ELSE shipped_at END,
    delivered_at = CASE WHEN p_new_status = 'delivered' THEN COALESCE(delivered_at, v_now) ELSE delivered_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN COALESCE(cancelled_at, v_now) ELSE cancelled_at END,
    tracking_number = CASE WHEN p_new_status = 'shipped' THEN NULLIF(trim(COALESCE(p_tracking_number, '')), '') ELSE tracking_number END,
    tracking_url = CASE WHEN p_new_status = 'shipped' THEN NULLIF(trim(COALESCE(p_tracking_url, '')), '') ELSE tracking_url END,
    updated_at = v_now
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history(order_id, from_status, to_status, changed_by, note, metadata)
  VALUES (
    p_order_id, v_old_status, p_new_status, v_actor_id,
    NULLIF(trim(COALESCE(p_note, '')), ''),
    jsonb_build_object('tracking_number', NULLIF(trim(COALESCE(p_tracking_number, '')), ''), 'tracking_url', NULLIF(trim(COALESCE(p_tracking_url, '')), ''))
  );

  RETURN jsonb_build_object('orderId', p_order_id, 'fromStatus', v_old_status, 'toStatus', p_new_status);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_order_notes(p_order_id UUID, p_notes TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_order RECORD;
BEGIN
  IF v_actor_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  IF v_role NOT IN ('admin', 'seller') THEN RAISE EXCEPTION 'ADMIN_ONLY'; END IF;

  SELECT id, seller_id, status INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_role = 'seller' AND v_order.seller_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'ORDER_NOT_ASSIGNED';
  END IF;

  UPDATE public.orders SET
    admin_notes = NULLIF(trim(COALESCE(p_notes, '')), ''),
    admin_notes_updated_at = now(),
    admin_notes_updated_by = v_actor_id,
    updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'orderId', v_order.id,
    'adminNotes', v_order.admin_notes,
    'updatedAt', v_order.admin_notes_updated_at,
    'updatedBy', v_order.admin_notes_updated_by
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_notes(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order_notes(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_payment_link(
  p_order_id UUID,
  p_payment_link_url TEXT,
  p_mark_as_sent BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_order RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  IF v_role NOT IN ('admin', 'seller') THEN RAISE EXCEPTION 'ORDER_STAFF_ONLY'; END IF;
  IF p_payment_link_url !~* '^https://' OR length(p_payment_link_url) > 500 THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_LINK';
  END IF;

  SELECT id, seller_id INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_role = 'seller' AND v_order.seller_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'ORDER_NOT_ASSIGNED';
  END IF;

  UPDATE public.orders SET
    payment_link_url = p_payment_link_url,
    payment_link_sent_at = CASE WHEN p_mark_as_sent THEN v_now ELSE NULL END,
    payment_link_sent_by = CASE WHEN p_mark_as_sent THEN v_actor_id ELSE NULL END,
    updated_at = v_now
  WHERE id = p_order_id;

  UPDATE public.payments SET
    payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
      'payment_link_url', p_payment_link_url,
      'payment_link_sent_at', CASE WHEN p_mark_as_sent THEN to_jsonb(v_now) ELSE 'null'::jsonb END
    ),
    updated_at = v_now
  WHERE order_id = p_order_id
    AND payment_method IN ('neo_link_direct', 'neo_link_installments');

  RETURN p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_payment_link(UUID, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_payment_link(UUID, TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_assign_order_seller(p_order_id UUID, p_seller_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_rate NUMERIC(6,2) := 0;
  v_total NUMERIC(12,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role = 'admin') THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;

  SELECT total INTO v_total FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  IF p_seller_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_seller_id AND role = 'seller') THEN
      RAISE EXCEPTION 'SELLER_NOT_FOUND';
    END IF;
    SELECT commission_percent INTO v_rate
    FROM public.seller_commission_rules
    WHERE seller_id = p_seller_id AND is_active = true
    LIMIT 1;
  END IF;

  UPDATE public.orders SET
    seller_id = p_seller_id,
    seller_commission_rate = COALESCE(v_rate, 0),
    seller_commission_amount = ROUND((v_total * COALESCE(v_rate, 0) / 100)::numeric, 2),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'orderId', p_order_id,
    'sellerId', p_seller_id,
    'commissionPercent', COALESCE(v_rate, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_assign_order_seller(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_assign_order_seller(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_order(
  p_order_id UUID,
  p_discount_percent NUMERIC,
  p_free_shipping BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_order RECORD;
  v_discount NUMERIC(12,2);
  v_shipping NUMERIC(12,2);
  v_total NUMERIC(12,2);
  v_note TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role = 'admin') THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;
  IF p_discount_percent NOT IN (0, 10, 20) THEN RAISE EXCEPTION 'INVALID_DISCOUNT'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_order.status <> 'pending' THEN RAISE EXCEPTION 'ORDER_NOT_ADJUSTABLE'; END IF;

  v_shipping := CASE WHEN p_free_shipping THEN 0 ELSE v_order.shipping_cost END;
  v_discount := round((v_order.subtotal * p_discount_percent / 100)::numeric, 2);
  v_total := GREATEST(round((v_order.subtotal + v_shipping - v_discount)::numeric, 2), 0);
  v_note := format(
    'Ajuste administrativo: descuento %s%%, envio %s, total Q%s. Descuento aplicado Q%s.',
    p_discount_percent,
    CASE WHEN p_free_shipping THEN 'gratis' ELSE 'Q' || to_char(v_shipping, 'FM999999990.00') END,
    to_char(v_total, 'FM999999990.00'),
    to_char(v_discount, 'FM999999990.00')
  );

  UPDATE public.orders SET
    discount_amount = v_discount,
    coupon_id = NULL,
    coupon_code = CASE WHEN p_discount_percent > 0 THEN 'ADMIN' || p_discount_percent::text ELSE NULL END,
    coupon_discount = CASE WHEN p_discount_percent > 0 THEN p_discount_percent ELSE NULL END,
    shipping_cost = v_shipping,
    total = v_total,
    admin_notes = concat_ws(E'\n', NULLIF(admin_notes, ''), v_note),
    admin_notes_updated_at = now(),
    admin_notes_updated_by = v_actor_id,
    updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments SET
    amount = v_total,
    payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
      'adjusted_by', v_actor_id,
      'discount_percent', p_discount_percent,
      'free_shipping', p_free_shipping,
      'adjusted_total', v_total,
      'adjusted_at', now()
    ),
    updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  INSERT INTO public.order_status_history(order_id, from_status, to_status, changed_by, note, metadata)
  VALUES (p_order_id, v_order.status, v_order.status, v_actor_id, v_note, jsonb_build_object('kind', 'order_adjustment'));

  RETURN jsonb_build_object(
    'id', p_order_id,
    'discount_amount', v_discount,
    'shipping_cost', v_shipping,
    'total', v_total,
    'coupon_code', CASE WHEN p_discount_percent > 0 THEN 'ADMIN' || p_discount_percent::text ELSE NULL END,
    'admin_notes', concat_ws(E'\n', NULLIF(v_order.admin_notes, ''), v_note)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_order(UUID, NUMERIC, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_order(UUID, NUMERIC, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_product(
  p_product_id UUID,
  p_product JSONB,
  p_colors JSONB,
  p_removed_variant_ids JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_product_id UUID := p_product_id;
  v_color JSONB;
  v_color_id UUID;
  v_image JSONB;
  v_image_id UUID;
  v_variant JSONB;
  v_variant_id UUID;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_kept_color_ids UUID[] := ARRAY[]::UUID[];
  v_kept_image_ids UUID[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role IN ('admin', 'warehouse')
  ) THEN
    RAISE EXCEPTION 'PRODUCT_STAFF_ONLY';
  END IF;
  IF jsonb_typeof(p_product) <> 'object' OR jsonb_typeof(p_colors) <> 'array' THEN
    RAISE EXCEPTION 'INVALID_PRODUCT_PAYLOAD';
  END IF;

  IF v_product_id IS NULL THEN
    INSERT INTO public.products(
      brand_id, category_id, name, slug, sku, description, base_price,
      compare_at_price, cost_price, invoice_fee_percent, neo_link_fee_percent,
      sale_price_markup_percent, calculated_sale_price, status, gender,
      is_featured, is_new_release, new_release_until, meta_title, meta_description
    ) VALUES (
      (p_product ->> 'brand_id')::UUID,
      (p_product ->> 'category_id')::UUID,
      trim(p_product ->> 'name'), trim(p_product ->> 'slug'), trim(p_product ->> 'sku'),
      NULLIF(trim(COALESCE(p_product ->> 'description', '')), ''),
      (p_product ->> 'base_price')::NUMERIC,
      NULLIF(p_product ->> 'compare_at_price', '')::NUMERIC,
      COALESCE((p_product ->> 'cost_price')::NUMERIC, 0),
      COALESCE((p_product ->> 'invoice_fee_percent')::NUMERIC, 0),
      COALESCE((p_product ->> 'neo_link_fee_percent')::NUMERIC, 0),
      COALESCE((p_product ->> 'sale_price_markup_percent')::NUMERIC, 0),
      NULLIF(p_product ->> 'calculated_sale_price', '')::NUMERIC,
      COALESCE(p_product ->> 'status', 'draft'), COALESCE(p_product ->> 'gender', 'unisex'),
      COALESCE((p_product ->> 'is_featured')::BOOLEAN, false),
      COALESCE((p_product ->> 'is_new_release')::BOOLEAN, false),
      NULLIF(p_product ->> 'new_release_until', '')::TIMESTAMPTZ,
      NULLIF(trim(COALESCE(p_product ->> 'meta_title', '')), ''),
      NULLIF(trim(COALESCE(p_product ->> 'meta_description', '')), '')
    ) RETURNING id INTO v_product_id;
  ELSE
    UPDATE public.products SET
      brand_id = (p_product ->> 'brand_id')::UUID,
      category_id = (p_product ->> 'category_id')::UUID,
      name = trim(p_product ->> 'name'), slug = trim(p_product ->> 'slug'), sku = trim(p_product ->> 'sku'),
      description = NULLIF(trim(COALESCE(p_product ->> 'description', '')), ''),
      base_price = (p_product ->> 'base_price')::NUMERIC,
      compare_at_price = NULLIF(p_product ->> 'compare_at_price', '')::NUMERIC,
      cost_price = COALESCE((p_product ->> 'cost_price')::NUMERIC, 0),
      invoice_fee_percent = COALESCE((p_product ->> 'invoice_fee_percent')::NUMERIC, 0),
      neo_link_fee_percent = COALESCE((p_product ->> 'neo_link_fee_percent')::NUMERIC, 0),
      sale_price_markup_percent = COALESCE((p_product ->> 'sale_price_markup_percent')::NUMERIC, 0),
      calculated_sale_price = NULLIF(p_product ->> 'calculated_sale_price', '')::NUMERIC,
      status = COALESCE(p_product ->> 'status', 'draft'),
      gender = COALESCE(p_product ->> 'gender', 'unisex'),
      is_featured = COALESCE((p_product ->> 'is_featured')::BOOLEAN, false),
      is_new_release = COALESCE((p_product ->> 'is_new_release')::BOOLEAN, false),
      new_release_until = NULLIF(p_product ->> 'new_release_until', '')::TIMESTAMPTZ,
      meta_title = NULLIF(trim(COALESCE(p_product ->> 'meta_title', '')), ''),
      meta_description = NULLIF(trim(COALESCE(p_product ->> 'meta_description', '')), ''),
      updated_at = now()
    WHERE id = v_product_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
  END IF;

  FOR v_color IN SELECT value FROM jsonb_array_elements(p_colors)
  LOOP
    v_color_id := NULLIF(v_color ->> 'id', '')::UUID;
    IF v_color_id IS NULL THEN
      INSERT INTO public.product_colors(
        product_id, color_name, color_code, sku_suffix, is_available, display_order
      ) VALUES (
        v_product_id, trim(v_color ->> 'color_name'), NULLIF(v_color ->> 'color_code', ''),
        trim(v_color ->> 'sku_suffix'), COALESCE((v_color ->> 'is_available')::BOOLEAN, true),
        COALESCE((v_color ->> 'display_order')::INTEGER, 0)
      ) RETURNING id INTO v_color_id;
    ELSE
      UPDATE public.product_colors SET
        color_name = trim(v_color ->> 'color_name'),
        color_code = NULLIF(v_color ->> 'color_code', ''),
        sku_suffix = trim(v_color ->> 'sku_suffix'),
        is_available = COALESCE((v_color ->> 'is_available')::BOOLEAN, true),
        display_order = COALESCE((v_color ->> 'display_order')::INTEGER, 0),
        updated_at = now()
      WHERE id = v_color_id AND product_id = v_product_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_PRODUCT_COLOR'; END IF;
    END IF;
    v_kept_color_ids := array_append(v_kept_color_ids, v_color_id);
    v_kept_image_ids := ARRAY[]::UUID[];

    FOR v_image IN SELECT value FROM jsonb_array_elements(COALESCE(v_color -> 'product_color_images', '[]'::jsonb))
    LOOP
      IF COALESCE(trim(v_image ->> 'image_url'), '') = '' THEN CONTINUE; END IF;
      v_image_id := NULLIF(v_image ->> 'id', '')::UUID;
      IF v_image_id IS NULL THEN
        INSERT INTO public.product_color_images(
          product_color_id, image_url, alt_text, display_order, image_type
        ) VALUES (
          v_color_id, trim(v_image ->> 'image_url'), NULLIF(trim(COALESCE(v_image ->> 'alt_text', '')), ''),
          COALESCE((v_image ->> 'display_order')::INTEGER, 0), COALESCE(v_image ->> 'image_type', 'front')
        ) RETURNING id INTO v_image_id;
      ELSE
        UPDATE public.product_color_images SET
          image_url = trim(v_image ->> 'image_url'),
          alt_text = NULLIF(trim(COALESCE(v_image ->> 'alt_text', '')), ''),
          display_order = COALESCE((v_image ->> 'display_order')::INTEGER, 0),
          image_type = COALESCE(v_image ->> 'image_type', 'front')
        WHERE id = v_image_id AND product_color_id = v_color_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_PRODUCT_IMAGE'; END IF;
      END IF;
      v_kept_image_ids := array_append(v_kept_image_ids, v_image_id);
    END LOOP;

    DELETE FROM public.product_color_images
    WHERE product_color_id = v_color_id AND NOT (id = ANY(v_kept_image_ids));

    FOR v_variant IN SELECT value FROM jsonb_array_elements(COALESCE(v_color -> 'product_variants', '[]'::jsonb))
    LOOP
      v_variant_id := NULLIF(v_variant ->> 'id', '')::UUID;
      v_new_stock := COALESCE((v_variant ->> 'stock_quantity')::INTEGER, 0);
      IF v_variant_id IS NULL THEN
        INSERT INTO public.product_variants(
          product_id, product_color_id, size_us, size_eu, size_uk, size_cm, sku,
          stock_quantity, low_stock_threshold, price_override, is_available
        ) VALUES (
          v_product_id, v_color_id,
          (v_variant ->> 'size_us')::NUMERIC, (v_variant ->> 'size_eu')::NUMERIC,
          (v_variant ->> 'size_uk')::NUMERIC, (v_variant ->> 'size_cm')::NUMERIC,
          trim(v_variant ->> 'sku'), v_new_stock,
          COALESCE((v_variant ->> 'low_stock_threshold')::INTEGER, 5),
          NULLIF(v_variant ->> 'price_override', '')::NUMERIC,
          COALESCE((v_variant ->> 'is_available')::BOOLEAN, true)
        ) RETURNING id INTO v_variant_id;
        v_old_stock := 0;
      ELSE
        SELECT stock_quantity INTO v_old_stock FROM public.product_variants
        WHERE id = v_variant_id AND product_id = v_product_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_PRODUCT_VARIANT'; END IF;
        UPDATE public.product_variants SET
          product_color_id = v_color_id,
          size_us = (v_variant ->> 'size_us')::NUMERIC,
          size_eu = (v_variant ->> 'size_eu')::NUMERIC,
          size_uk = (v_variant ->> 'size_uk')::NUMERIC,
          size_cm = (v_variant ->> 'size_cm')::NUMERIC,
          sku = trim(v_variant ->> 'sku'),
          stock_quantity = v_new_stock,
          low_stock_threshold = COALESCE((v_variant ->> 'low_stock_threshold')::INTEGER, 5),
          price_override = NULLIF(v_variant ->> 'price_override', '')::NUMERIC,
          is_available = COALESCE((v_variant ->> 'is_available')::BOOLEAN, true),
          updated_at = now()
        WHERE id = v_variant_id AND product_id = v_product_id;
      END IF;

      IF v_new_stock <> v_old_stock THEN
        INSERT INTO public.inventory_movements(
          variant_id, movement_type, quantity_delta, balance_after, reason, created_by
        ) VALUES (
          v_variant_id, 'adjustment', v_new_stock - v_old_stock, v_new_stock,
          'Edicion de producto', v_actor_id
        );
      END IF;
    END LOOP;
  END LOOP;

  UPDATE public.product_colors SET is_available = false, updated_at = now()
  WHERE product_id = v_product_id AND NOT (id = ANY(v_kept_color_ids));

  FOR v_variant_id IN
    SELECT (value #>> '{}')::UUID
    FROM jsonb_array_elements(COALESCE(p_removed_variant_ids, '[]'::jsonb))
  LOOP
    SELECT stock_quantity INTO v_old_stock FROM public.product_variants
    WHERE id = v_variant_id AND product_id = v_product_id FOR UPDATE;
    IF FOUND THEN
      UPDATE public.product_variants SET stock_quantity = 0, is_available = false, updated_at = now()
      WHERE id = v_variant_id;
      IF v_old_stock <> 0 THEN
        INSERT INTO public.inventory_movements(
          variant_id, movement_type, quantity_delta, balance_after, reason, created_by
        ) VALUES (v_variant_id, 'adjustment', -v_old_stock, 0, 'Variante desactivada', v_actor_id);
      END IF;
    END IF;
  END LOOP;

  RETURN v_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_product(UUID, JSONB, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_product(UUID, JSONB, JSONB, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_archive_product(p_product_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_variant RECORD;
  v_locked_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role = 'admin') THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;
  SELECT id INTO v_locked_product_id
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;
  IF v_locked_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  FOR v_variant IN
    SELECT id, stock_quantity FROM public.product_variants
    WHERE product_id = p_product_id AND stock_quantity <> 0 FOR UPDATE
  LOOP
    INSERT INTO public.inventory_movements(
      variant_id, movement_type, quantity_delta, balance_after, reason, created_by
    ) VALUES (
      v_variant.id, 'adjustment', -v_variant.stock_quantity, 0, 'Producto archivado', v_actor_id
    );
  END LOOP;

  UPDATE public.product_variants SET stock_quantity = 0, is_available = false, updated_at = now()
  WHERE product_id = p_product_id;
  UPDATE public.product_colors SET is_available = false, updated_at = now()
  WHERE product_id = p_product_id;
  UPDATE public.products SET status = 'archived', is_featured = false, updated_at = now()
  WHERE id = p_product_id;
  RETURN p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_archive_product(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_archive_product(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.commit_inventory_import(p_batch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_batch RECORD;
  v_row RECORD;
  v_data JSONB;
  v_brand_id UUID;
  v_category_id UUID;
  v_product_id UUID;
  v_color_id UUID;
  v_variant_id UUID;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_processed INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  IF v_role NOT IN ('admin', 'warehouse') THEN RAISE EXCEPTION 'PRODUCT_STAFF_ONLY'; END IF;

  SELECT * INTO v_batch FROM public.inventory_import_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'IMPORT_BATCH_NOT_FOUND'; END IF;
  IF v_role <> 'admin' AND v_batch.created_by IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'IMPORT_BATCH_NOT_OWNED';
  END IF;
  IF v_batch.status = 'committed' THEN
    RETURN jsonb_build_object('processed', 0, 'skipped', v_batch.error_rows, 'replayed', true);
  END IF;
  IF v_batch.status NOT IN ('previewed', 'failed') THEN RAISE EXCEPTION 'IMPORT_BATCH_NOT_READY'; END IF;

  UPDATE public.inventory_import_batches SET status = 'processing' WHERE id = p_batch_id;

  FOR v_row IN
    SELECT * FROM public.inventory_import_rows WHERE batch_id = p_batch_id ORDER BY row_number FOR UPDATE
  LOOP
    IF cardinality(v_row.errors) > 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;
    v_data := v_row.normalized_data;

    INSERT INTO public.brands(name, slug, is_active)
    VALUES (trim(v_data ->> 'marca'), lower(regexp_replace(trim(v_data ->> 'marca'), '[^a-zA-Z0-9]+', '-', 'g')), true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
    RETURNING id INTO v_brand_id;

    INSERT INTO public.categories(name, slug, is_active)
    VALUES (trim(v_data ->> 'categoria'), lower(regexp_replace(trim(v_data ->> 'categoria'), '[^a-zA-Z0-9]+', '-', 'g')), true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
    RETURNING id INTO v_category_id;

    SELECT id INTO v_product_id FROM public.products
    WHERE sku = v_data ->> 'codigo_producto' OR slug = v_data ->> 'slug'
    ORDER BY CASE WHEN sku = v_data ->> 'codigo_producto' THEN 0 ELSE 1 END LIMIT 1 FOR UPDATE;

    IF v_product_id IS NULL THEN
      INSERT INTO public.products(
        brand_id, category_id, name, slug, sku, description, base_price, compare_at_price,
        status, gender, cost_price, invoice_fee_percent, neo_link_fee_percent,
        sale_price_markup_percent, calculated_sale_price
      ) VALUES (
        v_brand_id, v_category_id, v_data ->> 'nombre', v_data ->> 'slug',
        v_data ->> 'codigo_producto', NULLIF(v_data ->> 'descripcion', ''),
        (v_data ->> 'precio_final_calculado')::NUMERIC,
        NULLIF(v_data ->> 'precio_anterior', '')::NUMERIC,
        COALESCE(v_data ->> 'estado', 'draft'),
        CASE v_data ->> 'seccion' WHEN 'hombre' THEN 'men' WHEN 'mujer' THEN 'women' WHEN 'ninos' THEN 'kids' ELSE 'unisex' END,
        COALESCE((v_data ->> 'costo')::NUMERIC, 0),
        COALESCE((v_data ->> 'porcentaje_factura')::NUMERIC, 0),
        COALESCE((v_data ->> 'porcentaje_neo_link')::NUMERIC, 0),
        COALESCE((v_data ->> 'porcentaje_margen')::NUMERIC, 0),
        (v_data ->> 'precio_final_calculado')::NUMERIC
      ) RETURNING id INTO v_product_id;
    ELSE
      UPDATE public.products SET
        brand_id = v_brand_id, category_id = v_category_id,
        name = v_data ->> 'nombre', description = NULLIF(v_data ->> 'descripcion', ''),
        base_price = (v_data ->> 'precio_final_calculado')::NUMERIC,
        compare_at_price = NULLIF(v_data ->> 'precio_anterior', '')::NUMERIC,
        status = COALESCE(v_data ->> 'estado', 'draft'),
        gender = CASE v_data ->> 'seccion' WHEN 'hombre' THEN 'men' WHEN 'mujer' THEN 'women' WHEN 'ninos' THEN 'kids' ELSE 'unisex' END,
        cost_price = COALESCE((v_data ->> 'costo')::NUMERIC, 0),
        invoice_fee_percent = COALESCE((v_data ->> 'porcentaje_factura')::NUMERIC, 0),
        neo_link_fee_percent = COALESCE((v_data ->> 'porcentaje_neo_link')::NUMERIC, 0),
        sale_price_markup_percent = COALESCE((v_data ->> 'porcentaje_margen')::NUMERIC, 0),
        calculated_sale_price = (v_data ->> 'precio_final_calculado')::NUMERIC,
        updated_at = now()
      WHERE id = v_product_id;
    END IF;

    SELECT id INTO v_color_id FROM public.product_colors
    WHERE product_id = v_product_id AND lower(color_name) = lower(v_data ->> 'color')
    LIMIT 1 FOR UPDATE;
    IF v_color_id IS NULL THEN
      INSERT INTO public.product_colors(product_id, color_name, color_code, sku_suffix, is_available)
      VALUES (
        v_product_id, v_data ->> 'color', COALESCE(NULLIF(v_data ->> 'codigo_color', ''), '#000000'),
        v_data ->> 'colorSkuSuffix', true
      ) RETURNING id INTO v_color_id;
    ELSE
      UPDATE public.product_colors SET
        color_code = COALESCE(NULLIF(v_data ->> 'codigo_color', ''), '#000000'),
        sku_suffix = v_data ->> 'colorSkuSuffix', is_available = true, updated_at = now()
      WHERE id = v_color_id;
    END IF;

    IF COALESCE(v_data ->> 'link_imagen_cloudinary', '') <> '' AND NOT EXISTS (
      SELECT 1 FROM public.product_color_images
      WHERE product_color_id = v_color_id AND image_url = v_data ->> 'link_imagen_cloudinary'
    ) THEN
      INSERT INTO public.product_color_images(product_color_id, image_url, alt_text, image_type)
      VALUES (v_color_id, v_data ->> 'link_imagen_cloudinary', v_data ->> 'nombre', 'front');
    END IF;

    v_new_stock := COALESCE((v_data ->> 'stock')::INTEGER, 0);
    SELECT id, stock_quantity INTO v_variant_id, v_old_stock FROM public.product_variants
    WHERE sku = v_data ->> 'sku_variante' FOR UPDATE;

    IF v_variant_id IS NULL THEN
      INSERT INTO public.product_variants(
        product_id, product_color_id, size_us, size_eu, size_uk, size_cm, sku,
        stock_quantity, low_stock_threshold, price_override, is_available
      ) VALUES (
        v_product_id, v_color_id, (v_data ->> 'talla_us')::NUMERIC,
        COALESCE((v_data ->> 'talla_eu')::NUMERIC, 0), COALESCE((v_data ->> 'talla_uk')::NUMERIC, 0),
        COALESCE((v_data ->> 'talla_cm')::NUMERIC, 0), v_data ->> 'sku_variante',
        v_new_stock, COALESCE((v_data ->> 'stock_minimo')::INTEGER, 5),
        NULLIF(v_data ->> 'precio_especial_talla', '')::NUMERIC, v_new_stock > 0
      ) RETURNING id INTO v_variant_id;
      v_old_stock := 0;
    ELSE
      UPDATE public.product_variants SET
        product_id = v_product_id, product_color_id = v_color_id,
        size_us = (v_data ->> 'talla_us')::NUMERIC,
        size_eu = COALESCE((v_data ->> 'talla_eu')::NUMERIC, 0),
        size_uk = COALESCE((v_data ->> 'talla_uk')::NUMERIC, 0),
        size_cm = COALESCE((v_data ->> 'talla_cm')::NUMERIC, 0),
        stock_quantity = v_new_stock,
        low_stock_threshold = COALESCE((v_data ->> 'stock_minimo')::INTEGER, 5),
        price_override = NULLIF(v_data ->> 'precio_especial_talla', '')::NUMERIC,
        is_available = v_new_stock > 0, updated_at = now()
      WHERE id = v_variant_id;
    END IF;

    IF v_new_stock <> v_old_stock THEN
      INSERT INTO public.inventory_movements(
        variant_id, movement_type, quantity_delta, balance_after, reason, created_by
      ) VALUES (
        v_variant_id, 'import', v_new_stock - v_old_stock, v_new_stock,
        'Importacion de inventario ' || p_batch_id::text, v_actor_id
      );
    END IF;
    v_processed := v_processed + 1;
  END LOOP;

  UPDATE public.inventory_import_batches SET
    status = 'committed', committed_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object('processed', v_processed, 'skipped', v_skipped, 'replayed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.commit_inventory_import(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.commit_inventory_import(UUID) TO authenticated;

DROP POLICY IF EXISTS "shipments_staff_all" ON public.shipments;
DROP POLICY IF EXISTS "shipments_admin_warehouse_all" ON public.shipments;
CREATE POLICY "shipments_admin_warehouse_all" ON public.shipments
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse'))
);
DROP POLICY IF EXISTS "shipments_seller_assigned" ON public.shipments;
CREATE POLICY "shipments_seller_assigned" ON public.shipments
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.profiles p ON p.id = auth.uid() AND p.role = 'seller'
    WHERE o.id = order_id AND o.seller_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.profiles p ON p.id = auth.uid() AND p.role = 'seller'
    WHERE o.id = order_id AND o.seller_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.admin_upsert_shipment(
  p_shipment_id UUID,
  p_order_id UUID,
  p_carrier TEXT,
  p_service TEXT,
  p_status TEXT,
  p_tracking_number TEXT,
  p_tracking_url TEXT,
  p_shipping_cost NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_order RECORD;
  v_shipment_id UUID := p_shipment_id;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  IF v_role NOT IN ('admin', 'seller', 'warehouse') THEN RAISE EXCEPTION 'STAFF_ONLY'; END IF;
  IF p_status NOT IN ('pending', 'ready', 'shipped', 'in_transit', 'delivered', 'exception', 'returned', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_SHIPMENT_STATUS';
  END IF;
  IF COALESCE(trim(p_carrier), '') = '' THEN RAISE EXCEPTION 'CARRIER_REQUIRED'; END IF;

  SELECT id, seller_id, status INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_role = 'seller' AND v_order.seller_id IS DISTINCT FROM v_actor_id THEN RAISE EXCEPTION 'ORDER_NOT_ASSIGNED'; END IF;
  IF p_status IN ('shipped', 'in_transit') AND v_order.status NOT IN ('processing', 'shipped') THEN
    RAISE EXCEPTION 'ORDER_NOT_READY_TO_SHIP';
  END IF;
  IF p_status = 'delivered' AND v_order.status NOT IN ('shipped', 'delivered') THEN
    RAISE EXCEPTION 'ORDER_NOT_SHIPPED';
  END IF;

  IF v_shipment_id IS NULL THEN
    INSERT INTO public.shipments(
      order_id, carrier, service, status, tracking_number, tracking_url,
      shipping_cost, shipped_at, delivered_at, created_by
    ) VALUES (
      p_order_id, trim(p_carrier), NULLIF(trim(COALESCE(p_service, '')), ''), p_status,
      NULLIF(trim(COALESCE(p_tracking_number, '')), ''), NULLIF(trim(COALESCE(p_tracking_url, '')), ''),
      p_shipping_cost,
      CASE WHEN p_status IN ('shipped', 'in_transit', 'delivered') THEN now() ELSE NULL END,
      CASE WHEN p_status = 'delivered' THEN now() ELSE NULL END,
      v_actor_id
    ) RETURNING id INTO v_shipment_id;
  ELSE
    UPDATE public.shipments SET
      carrier = trim(p_carrier), service = NULLIF(trim(COALESCE(p_service, '')), ''),
      status = p_status, tracking_number = NULLIF(trim(COALESCE(p_tracking_number, '')), ''),
      tracking_url = NULLIF(trim(COALESCE(p_tracking_url, '')), ''), shipping_cost = p_shipping_cost,
      shipped_at = CASE WHEN p_status IN ('shipped', 'in_transit', 'delivered') THEN COALESCE(shipped_at, now()) ELSE shipped_at END,
      delivered_at = CASE WHEN p_status = 'delivered' THEN COALESCE(delivered_at, now()) ELSE delivered_at END,
      updated_at = now()
    WHERE id = v_shipment_id AND order_id = p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'SHIPMENT_NOT_FOUND'; END IF;
  END IF;

  UPDATE public.orders SET
    tracking_number = NULLIF(trim(COALESCE(p_tracking_number, '')), ''),
    tracking_url = NULLIF(trim(COALESCE(p_tracking_url, '')), ''),
    status = CASE WHEN p_status = 'delivered' THEN 'delivered' WHEN p_status IN ('shipped', 'in_transit') THEN 'shipped' ELSE status END,
    shipped_at = CASE WHEN p_status IN ('shipped', 'in_transit', 'delivered') THEN COALESCE(shipped_at, now()) ELSE shipped_at END,
    delivered_at = CASE WHEN p_status = 'delivered' THEN COALESCE(delivered_at, now()) ELSE delivered_at END,
    updated_at = now()
  WHERE id = p_order_id;

  IF (p_status IN ('shipped', 'in_transit') AND v_order.status <> 'shipped') THEN
    INSERT INTO public.order_status_history(order_id, from_status, to_status, changed_by, note, metadata)
    VALUES (p_order_id, v_order.status, 'shipped', v_actor_id, 'Envío registrado', jsonb_build_object('shipment_id', v_shipment_id));
  ELSIF p_status = 'delivered' AND v_order.status <> 'delivered' THEN
    INSERT INTO public.order_status_history(order_id, from_status, to_status, changed_by, note, metadata)
    VALUES (p_order_id, v_order.status, 'delivered', v_actor_id, 'Entrega confirmada', jsonb_build_object('shipment_id', v_shipment_id));
  END IF;

  RETURN v_shipment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_shipment(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_shipment(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_return_request(
  p_request_id UUID,
  p_status TEXT,
  p_resolution_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;
  IF p_status NOT IN ('requested', 'approved', 'rejected', 'received', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_RETURN_STATUS';
  END IF;

  UPDATE public.return_requests SET
    status = p_status,
    resolution_notes = NULLIF(trim(COALESCE(p_resolution_notes, '')), ''),
    resolved_at = CASE WHEN p_status IN ('rejected', 'completed', 'cancelled') THEN now() ELSE NULL END,
    resolved_by = CASE WHEN p_status IN ('rejected', 'completed', 'cancelled') THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'RETURN_REQUEST_NOT_FOUND'; END IF;
  RETURN p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_return_request(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_return_request(UUID, TEXT, TEXT) TO authenticated;
