-- Checkout integrity, inventory audit, seller isolation and operational foundations.

-- Existing production databases may predate the reconstructed baseline.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMPTZ;

-- Automated lifecycle events have no authenticated profile actor.
ALTER TABLE public.order_status_history
  ALTER COLUMN changed_by DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON public.orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_pending_expiration_idx
  ON public.orders(expires_at)
  WHERE status = 'pending' AND inventory_released_at IS NULL;

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'cancellation', 'refund', 'expiration', 'adjustment', 'import', 'return')),
  quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_order_once
  ON public.inventory_movements(order_id, variant_id, movement_type)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS inventory_movements_variant_date_idx
  ON public.inventory_movements(variant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  service TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'shipped', 'in_transit', 'delivered', 'exception', 'returned', 'cancelled')),
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_cost NUMERIC(12,2) CHECK (shipping_cost IS NULL OR shipping_cost >= 0),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipments_order_id_idx ON public.shipments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_unique
  ON public.shipments(carrier, tracking_number)
  WHERE tracking_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('size_exchange', 'return', 'damaged_item', 'wrong_item')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'completed', 'cancelled')),
  reason TEXT NOT NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS return_requests_order_id_idx ON public.return_requests(order_id);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE(event_key, recipient)
);

CREATE TABLE IF NOT EXISTS public.guest_coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  guest_email TEXT NOT NULL,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guest_coupon_uses_lookup_idx
  ON public.guest_coupon_uses(coupon_id, guest_email, used_at DESC);

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(bucket, key_hash)
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_coupon_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_movements_staff_read" ON public.inventory_movements;
CREATE POLICY "inventory_movements_staff_read" ON public.inventory_movements
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse'))
);
DROP POLICY IF EXISTS "shipments_staff_all" ON public.shipments;
CREATE POLICY "shipments_staff_all" ON public.shipments
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'seller', 'warehouse'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'seller', 'warehouse'))
);
DROP POLICY IF EXISTS "shipments_customer_read" ON public.shipments;
CREATE POLICY "shipments_customer_read" ON public.shipments
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "returns_customer_own" ON public.return_requests;
CREATE POLICY "returns_customer_own" ON public.return_requests
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "returns_admin_all" ON public.return_requests;
CREATE POLICY "returns_admin_all" ON public.return_requests
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
DROP POLICY IF EXISTS "email_logs_admin_read" ON public.email_logs;
CREATE POLICY "email_logs_admin_read" ON public.email_logs
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Sellers only see the orders assigned to them. Admin policies remain unchanged.
DROP POLICY IF EXISTS "orders_seller_read_assigned" ON public.orders;
CREATE POLICY "orders_seller_read_assigned" ON public.orders
FOR SELECT TO authenticated USING (
  seller_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'seller')
);

DROP POLICY IF EXISTS "order_items_seller_read_assigned" ON public.order_items;
CREATE POLICY "order_items_seller_read_assigned" ON public.order_items
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.seller_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'seller')
  )
);

DROP POLICY IF EXISTS "payments_seller_read_assigned" ON public.payments;
CREATE POLICY "payments_seller_read_assigned" ON public.payments
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.seller_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'seller')
  )
);

DROP POLICY IF EXISTS "profiles_seller_read_customers" ON public.profiles;
CREATE OR REPLACE FUNCTION public.seller_can_read_customer(p_customer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.profiles seller ON seller.id = auth.uid()
    WHERE o.user_id = p_customer_id
      AND o.seller_id = auth.uid()
      AND seller.role = 'seller'
  );
$$;

REVOKE ALL ON FUNCTION public.seller_can_read_customer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_can_read_customer(UUID) TO authenticated;

CREATE POLICY "profiles_seller_read_customers" ON public.profiles
FOR SELECT TO authenticated USING (
  public.seller_can_read_customer(id)
);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket TEXT,
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_key_hash TEXT := encode(digest(p_key, 'sha256'), 'hex');
  v_row public.rate_limit_buckets%ROWTYPE;
  v_allowed BOOLEAN;
BEGIN
  IF p_bucket IS NULL OR p_key IS NULL OR p_max < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'INVALID_RATE_LIMIT_ARGUMENTS';
  END IF;

  INSERT INTO public.rate_limit_buckets(bucket, key_hash, request_count, reset_at, updated_at)
  VALUES (p_bucket, v_key_hash, 1, v_now + make_interval(secs => p_window_seconds), v_now)
  ON CONFLICT (bucket, key_hash) DO UPDATE SET
    request_count = CASE
      WHEN rate_limit_buckets.reset_at <= v_now THEN 1
      ELSE rate_limit_buckets.request_count + 1
    END,
    reset_at = CASE
      WHEN rate_limit_buckets.reset_at <= v_now THEN v_now + make_interval(secs => p_window_seconds)
      ELSE rate_limit_buckets.reset_at
    END,
    updated_at = v_now
  RETURNING * INTO v_row;

  v_allowed := v_row.request_count <= p_max;
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', GREATEST(p_max - v_row.request_count, 0),
    'retryAfterSeconds', CASE WHEN v_allowed THEN 0 ELSE GREATEST(CEIL(EXTRACT(EPOCH FROM (v_row.reset_at - v_now)))::INTEGER, 1) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.assign_order_to_next_seller_internal(p_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_seller_id UUID;
  v_last_position INTEGER;
  v_next_seller_id UUID;
  v_commission_rate NUMERIC(6,2) := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  INSERT INTO public.sales_assignment_queue(singleton)
  VALUES (true) ON CONFLICT (singleton) DO NOTHING;

  SELECT last_seller_id INTO v_last_seller_id
  FROM public.sales_assignment_queue WHERE singleton = true FOR UPDATE;

  WITH sellers AS (
    SELECT id, row_number() OVER (ORDER BY COALESCE(full_name, email, id::text), id) AS position
    FROM public.profiles WHERE role = 'seller'
  )
  SELECT position INTO v_last_position FROM sellers WHERE id = v_last_seller_id;

  WITH sellers AS (
    SELECT id, row_number() OVER (ORDER BY COALESCE(full_name, email, id::text), id) AS position
    FROM public.profiles WHERE role = 'seller'
  )
  SELECT id INTO v_next_seller_id FROM sellers
  WHERE v_last_position IS NULL OR position > v_last_position
  ORDER BY position LIMIT 1;

  IF v_next_seller_id IS NULL THEN
    SELECT id INTO v_next_seller_id FROM public.profiles
    WHERE role = 'seller' ORDER BY COALESCE(full_name, email, id::text), id LIMIT 1;
  END IF;

  IF v_next_seller_id IS NULL THEN RETURN NULL; END IF;

  SELECT commission_percent INTO v_commission_rate
  FROM public.seller_commission_rules
  WHERE seller_id = v_next_seller_id AND is_active = true LIMIT 1;

  UPDATE public.orders SET
    seller_id = v_next_seller_id,
    seller_commission_rate = COALESCE(v_commission_rate, 0),
    seller_commission_amount = ROUND((total * COALESCE(v_commission_rate, 0) / 100)::numeric, 2)
  WHERE id = p_order_id AND seller_id IS NULL;

  UPDATE public.sales_assignment_queue
  SET last_seller_id = v_next_seller_id, updated_at = now()
  WHERE singleton = true;

  RETURN v_next_seller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_order_to_next_seller_internal(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.assign_order_to_next_seller(p_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'ADMIN_ONLY';
  END IF;

  RETURN public.assign_order_to_next_seller_internal(p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.assign_order_to_next_seller(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_order_to_next_seller(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.assign_order_to_next_seller(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_manual_order(
  p_result JSONB,
  p_payment_method TEXT,
  p_idempotency_key TEXT,
  p_is_own_delivery BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID := (p_result ->> 'orderId')::UUID;
  v_expires_at TIMESTAMPTZ := now() + interval '24 hours';
  v_is_neo_link BOOLEAN := p_payment_method IN ('neo_link_direct', 'neo_link_installments');
  v_seller_id UUID;
BEGIN
  UPDATE public.orders
  SET idempotency_key = p_idempotency_key, expires_at = v_expires_at
  WHERE id = v_order_id;

  UPDATE public.payments
  SET
    payment_method = p_payment_method,
    provider = CASE WHEN v_is_neo_link THEN 'neo_link' ELSE 'manual' END,
    idempotency_key = p_idempotency_key,
    payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
      'mode', CASE WHEN v_is_neo_link THEN 'payment_link' ELSE 'manual' END,
      'selected_method', p_payment_method,
      'contact_channel', 'whatsapp',
      'requires_manual_confirmation', p_payment_method <> 'cash_on_delivery',
      'requires_payment_link', v_is_neo_link,
      'supports_installments', p_payment_method = 'neo_link_installments',
      'delivery_method', CASE WHEN p_is_own_delivery THEN 'own_delivery' ELSE 'guatex_collect' END,
      'shipping_fee_collection', CASE WHEN p_is_own_delivery THEN 'included_in_order' ELSE 'paid_to_carrier_on_delivery' END
    ),
    updated_at = now()
  WHERE order_id = v_order_id AND status = 'pending';

  INSERT INTO public.inventory_movements(
    variant_id, order_id, movement_type, quantity_delta, balance_after, reason
  )
  SELECT oi.variant_id, oi.order_id, 'sale', -oi.quantity, pv.stock_quantity, 'Pedido confirmado en checkout'
  FROM public.order_items oi
  JOIN public.product_variants pv ON pv.id = oi.variant_id
  WHERE oi.order_id = v_order_id
  ON CONFLICT (order_id, variant_id, movement_type) WHERE order_id IS NOT NULL DO NOTHING;

  v_seller_id := public.assign_order_to_next_seller_internal(v_order_id);

  RETURN p_result || jsonb_build_object(
    'paymentMethod', p_payment_method,
    'idempotencyKey', p_idempotency_key,
    'expiresAt', v_expires_at,
    'sellerId', v_seller_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_manual_order(JSONB, TEXT, TEXT, BOOLEAN) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_manual_order_v2(
  p_shipping JSONB,
  p_customer_notes TEXT,
  p_coupon_code TEXT,
  p_payment_method TEXT,
  p_idempotency_key TEXT,
  p_is_own_delivery BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing RECORD;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 16 OR length(p_idempotency_key) > 100 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE id = p_payment_method AND is_enabled = true AND is_public = true) THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
  END IF;

  SELECT id, order_number, subtotal, shipping_cost, discount_amount, total, guest_access_token, expires_at
  INTO v_existing FROM public.orders
  WHERE idempotency_key = p_idempotency_key AND user_id = v_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'orderId', v_existing.id, 'orderNumber', v_existing.order_number,
      'subtotal', v_existing.subtotal, 'shippingCost', v_existing.shipping_cost,
      'discountAmount', v_existing.discount_amount, 'total', v_existing.total,
      'expiresAt', v_existing.expires_at, 'replayed', true
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.cart_items ci
    LEFT JOIN public.product_variants pv ON pv.id = ci.variant_id
    LEFT JOIN public.product_colors pc ON pc.id = pv.product_color_id
    LEFT JOIN public.products p ON p.id = pv.product_id
    WHERE ci.user_id = v_user_id
      AND (pv.id IS NULL OR pv.is_available IS DISTINCT FROM true OR pc.is_available IS DISTINCT FROM true
        OR p.status <> 'active' OR ci.quantity < 1 OR ci.quantity > 20 OR ci.quantity > pv.stock_quantity)
  ) THEN
    RAISE EXCEPTION 'CART_CONTAINS_UNAVAILABLE_ITEM';
  END IF;

  v_result := public.create_manual_order(p_shipping, p_customer_notes, p_coupon_code);
  RETURN public.finalize_manual_order(v_result, p_payment_method, p_idempotency_key, p_is_own_delivery);
EXCEPTION WHEN unique_violation THEN
  SELECT id, order_number, subtotal, shipping_cost, discount_amount, total, expires_at
  INTO v_existing FROM public.orders WHERE idempotency_key = p_idempotency_key AND user_id = v_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'orderId', v_existing.id, 'orderNumber', v_existing.order_number,
      'subtotal', v_existing.subtotal, 'shippingCost', v_existing.shipping_cost,
      'discountAmount', v_existing.discount_amount, 'total', v_existing.total,
      'expiresAt', v_existing.expires_at, 'replayed', true
    );
  END IF;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_manual_order_v2(JSONB, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_manual_order_v2(JSONB, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_guest_manual_order_v2(
  p_customer_email TEXT,
  p_shipping JSONB,
  p_items JSONB,
  p_customer_notes TEXT,
  p_coupon_code TEXT,
  p_payment_method TEXT,
  p_idempotency_key TEXT,
  p_is_own_delivery BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(COALESCE(p_customer_email, '')));
  v_existing RECORD;
  v_result JSONB;
  v_coupon_id UUID;
  v_coupon_max_per_user INTEGER;
  v_coupon_uses INTEGER;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 16 OR length(p_idempotency_key) > 100 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE id = p_payment_method AND is_enabled = true AND is_public = true) THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
  END IF;

  IF COALESCE(trim(p_coupon_code), '') <> '' THEN
    SELECT id, max_uses_per_user INTO v_coupon_id, v_coupon_max_per_user
    FROM public.coupons
    WHERE upper(code) = upper(trim(p_coupon_code)) AND is_active = true
    FOR UPDATE;
    IF v_coupon_id IS NOT NULL AND v_coupon_max_per_user IS NOT NULL THEN
      SELECT count(*) INTO v_coupon_uses FROM public.guest_coupon_uses
      WHERE coupon_id = v_coupon_id AND guest_email = v_email;
      IF v_coupon_uses >= v_coupon_max_per_user THEN
        RAISE EXCEPTION 'COUPON_USER_LIMIT_REACHED';
      END IF;
    END IF;
  END IF;

  SELECT id, order_number, subtotal, shipping_cost, discount_amount, total, guest_access_token, expires_at
  INTO v_existing FROM public.orders
  WHERE idempotency_key = p_idempotency_key AND guest_email = v_email;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'orderId', v_existing.id, 'orderNumber', v_existing.order_number,
      'accessToken', v_existing.guest_access_token,
      'subtotal', v_existing.subtotal, 'shippingCost', v_existing.shipping_cost,
      'discountAmount', v_existing.discount_amount, 'total', v_existing.total,
      'expiresAt', v_existing.expires_at, 'replayed', true
    );
  END IF;

  v_result := public.create_guest_manual_order(v_email, p_shipping, p_items, p_customer_notes, p_coupon_code);
  v_result := public.finalize_manual_order(v_result, p_payment_method, p_idempotency_key, p_is_own_delivery);
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO public.guest_coupon_uses(coupon_id, guest_email, order_id)
    VALUES (v_coupon_id, v_email, (v_result ->> 'orderId')::UUID);
  END IF;
  RETURN v_result;
EXCEPTION WHEN unique_violation THEN
  SELECT id, order_number, subtotal, shipping_cost, discount_amount, total, guest_access_token, expires_at
  INTO v_existing FROM public.orders WHERE idempotency_key = p_idempotency_key AND guest_email = v_email;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'orderId', v_existing.id, 'orderNumber', v_existing.order_number,
      'accessToken', v_existing.guest_access_token,
      'subtotal', v_existing.subtotal, 'shippingCost', v_existing.shipping_cost,
      'discountAmount', v_existing.discount_amount, 'total', v_existing.total,
      'expiresAt', v_existing.expires_at, 'replayed', true
    );
  END IF;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_manual_order_v2(TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_manual_order_v2(TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION public.release_order_inventory(
  p_order_id UUID,
  p_movement_type TEXT,
  p_reason TEXT,
  p_actor UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT id, inventory_released_at INTO v_order
  FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_order.inventory_released_at IS NOT NULL THEN RETURN false; END IF;

  UPDATE public.product_variants pv
  SET stock_quantity = pv.stock_quantity + oi.quantity, updated_at = now()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND oi.variant_id = pv.id;

  INSERT INTO public.inventory_movements(
    variant_id, order_id, movement_type, quantity_delta, balance_after, reason, created_by
  )
  SELECT oi.variant_id, oi.order_id, p_movement_type, oi.quantity, pv.stock_quantity, p_reason, p_actor
  FROM public.order_items oi JOIN public.product_variants pv ON pv.id = oi.variant_id
  WHERE oi.order_id = p_order_id
  ON CONFLICT (order_id, variant_id, movement_type) WHERE order_id IS NOT NULL DO NOTHING;

  UPDATE public.orders SET inventory_released_at = now() WHERE id = p_order_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.release_order_inventory(UUID, TEXT, TEXT, UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.expire_pending_orders(p_limit INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_count INTEGER := 0;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED'; END IF;
  FOR v_order IN
    SELECT id FROM public.orders
    WHERE status = 'pending' AND expires_at <= now() AND inventory_released_at IS NULL
    ORDER BY expires_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit, 1), 500)
  LOOP
    PERFORM public.release_order_inventory(v_order.id, 'expiration', 'Pedido vencido sin pago', NULL);
    UPDATE public.orders SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = v_order.id;
    UPDATE public.payments SET status = 'failed', failed_at = COALESCE(failed_at, now()), failure_reason = 'ORDER_EXPIRED', updated_at = now()
    WHERE order_id = v_order.id AND status IN ('pending', 'processing');
    INSERT INTO public.order_status_history(order_id, from_status, to_status, note, metadata)
    VALUES (
      v_order.id,
      'pending',
      'cancelled',
      'Pedido vencido automáticamente sin pago',
      jsonb_build_object('reason', 'ORDER_EXPIRED')
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_pending_orders(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_pending_orders(INTEGER) TO service_role;

DROP TRIGGER IF EXISTS trg_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_returns_updated_at ON public.return_requests;
CREATE TRIGGER trg_returns_updated_at BEFORE UPDATE ON public.return_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER trg_email_logs_updated_at BEFORE UPDATE ON public.email_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
