-- Resolve staff access inside PostgreSQL so server rendering does not depend on a
-- service-role client or on a second RLS profile lookup.

CREATE OR REPLACE FUNCTION public.current_authenticated_profile()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(profile_row)
  FROM (
    SELECT id, full_name, email, phone, role, avatar_url
    FROM public.profiles
    WHERE id = auth.uid()
  ) AS profile_row;
$$;

REVOKE ALL ON FUNCTION public.current_authenticated_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_authenticated_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_list_orders(
  p_status TEXT DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_result JSONB;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'seller') THEN
    RAISE EXCEPTION 'STAFF_ORDERS_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(result_row.payload ORDER BY result_row.created_at DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT
      o.created_at,
      to_jsonb(o) || jsonb_build_object(
        'profiles', (
          SELECT jsonb_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone)
          FROM public.profiles p WHERE p.id = o.user_id
        ),
        'seller', (
          SELECT jsonb_build_object('id', s.id, 'full_name', s.full_name, 'email', s.email)
          FROM public.profiles s WHERE s.id = o.seller_id
        ),
        'order_items', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          ) ORDER BY oi.created_at)
          FROM public.order_items oi WHERE oi.order_id = o.id
        ), '[]'::JSONB)
      ) AS payload
    FROM public.orders o
    WHERE (v_role = 'admin' OR o.seller_id = auth.uid())
      AND (p_status IS NULL OR p_status = '' OR o.status = p_status)
      AND (
        p_query IS NULL OR trim(p_query) = ''
        OR o.order_number ILIKE '%' || trim(p_query) || '%'
        OR o.shipping_recipient_name ILIKE '%' || trim(p_query) || '%'
      )
      AND (
        p_from IS NULL
        OR o.created_at >= (p_from::TIMESTAMP AT TIME ZONE 'America/Guatemala')
      )
      AND (
        p_to IS NULL
        OR o.created_at < ((p_to + 1)::TIMESTAMP AT TIME ZONE 'America/Guatemala')
      )
  ) AS result_row;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_list_orders(TEXT, TEXT, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_list_orders(TEXT, TEXT, DATE, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_get_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_result JSONB;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'seller') THEN
    RAISE EXCEPTION 'STAFF_ORDERS_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(o) || jsonb_build_object(
    'profiles', (
      SELECT jsonb_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone)
      FROM public.profiles p WHERE p.id = o.user_id
    ),
    'seller', (
      SELECT jsonb_build_object('id', s.id, 'full_name', s.full_name, 'email', s.email)
      FROM public.profiles s WHERE s.id = o.seller_id
    ),
    'order_items', COALESCE((
      SELECT jsonb_agg(to_jsonb(oi) ORDER BY oi.created_at)
      FROM public.order_items oi WHERE oi.order_id = o.id
    ), '[]'::JSONB),
    'payments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', pay.id,
        'payment_method', pay.payment_method,
        'provider', pay.provider,
        'amount', pay.amount,
        'status', pay.status,
        'transaction_id', pay.transaction_id,
        'provider_reference', pay.provider_reference,
        'payment_details', pay.payment_details,
        'created_at', pay.created_at
      ) ORDER BY pay.created_at DESC)
      FROM public.payments pay WHERE pay.order_id = o.id
    ), '[]'::JSONB),
    'seller_assignments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', osa.id,
        'assignment_source', osa.assignment_source,
        'assigned_at', osa.assigned_at,
        'assigned_seller', (
          SELECT jsonb_build_object('id', sp.id, 'full_name', sp.full_name, 'email', sp.email)
          FROM public.profiles sp WHERE sp.id = osa.seller_id
        ),
        'previous_seller', (
          SELECT jsonb_build_object('id', pp.id, 'full_name', pp.full_name, 'email', pp.email)
          FROM public.profiles pp WHERE pp.id = osa.previous_seller_id
        ),
        'actor', (
          SELECT jsonb_build_object('id', ap.id, 'full_name', ap.full_name, 'email', ap.email)
          FROM public.profiles ap WHERE ap.id = osa.assigned_by
        )
      ) ORDER BY osa.assigned_at DESC)
      FROM public.order_seller_assignments osa WHERE osa.order_id = o.id
    ), '[]'::JSONB),
    'shipments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', sh.id,
        'carrier', sh.carrier,
        'service', sh.service,
        'status', sh.status,
        'tracking_number', sh.tracking_number,
        'tracking_url', sh.tracking_url,
        'shipping_cost', sh.shipping_cost
      ) ORDER BY sh.created_at DESC)
      FROM public.shipments sh WHERE sh.order_id = o.id
    ), '[]'::JSONB)
  )
  INTO v_result
  FROM public.orders o
  WHERE o.id = p_order_id
    AND (v_role = 'admin' OR o.seller_id = auth.uid());

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_get_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_get_order(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_return_requests()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(result_row.payload ORDER BY result_row.created_at DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT rr.created_at, jsonb_build_object(
      'id', rr.id,
      'request_type', rr.request_type,
      'status', rr.status,
      'reason', rr.reason,
      'resolution_notes', rr.resolution_notes,
      'created_at', rr.created_at,
      'updated_at', rr.updated_at,
      'orders', jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'total', o.total,
        'guest_email', o.guest_email,
        'shipping_recipient_name', o.shipping_recipient_name,
        'shipping_phone', o.shipping_phone,
        'customer', (
          SELECT jsonb_build_object('full_name', p.full_name, 'email', p.email, 'phone', p.phone)
          FROM public.profiles p WHERE p.id = o.user_id
        ),
        'payments', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', pay.id,
            'payment_method', pay.payment_method,
            'provider', pay.provider,
            'provider_reference', pay.provider_reference,
            'transaction_id', pay.transaction_id,
            'amount', pay.amount,
            'status', pay.status,
            'created_at', pay.created_at
          ) ORDER BY pay.created_at DESC)
          FROM public.payments pay WHERE pay.order_id = o.id
        ), '[]'::JSONB)
      )
    ) AS payload
    FROM public.return_requests rr
    JOIN public.orders o ON o.id = rr.order_id
  ) AS result_row;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_return_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_return_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_return_request(
  p_order_number TEXT,
  p_request_type TEXT,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_request_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'ADMIN_ONLY' USING ERRCODE = '42501';
  END IF;
  IF p_request_type NOT IN ('size_exchange', 'return', 'damaged_item', 'wrong_item') THEN
    RAISE EXCEPTION 'INVALID_RETURN_TYPE';
  END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 5 OR length(trim(p_reason)) > 1000 THEN
    RAISE EXCEPTION 'INVALID_RETURN_REASON';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE lower(order_number) = lower(trim(leading '#' FROM trim(p_order_number)))
  LIMIT 1;

  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.return_requests
    WHERE order_id = v_order.id
      AND status NOT IN ('rejected', 'completed', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'OPEN_RETURN_EXISTS';
  END IF;

  INSERT INTO public.return_requests(order_id, user_id, guest_email, request_type, reason, status)
  VALUES (v_order.id, v_order.user_id, v_order.guest_email, p_request_type, trim(p_reason), 'requested')
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_return_request(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_return_request(TEXT, TEXT, TEXT) TO authenticated;
