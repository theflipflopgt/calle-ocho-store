-- Seller role for order operations.
-- Sellers can work orders only: read through server routes, update order status,
-- write internal notes, and read/write order status history through the existing
-- controlled functions. Full admin-only areas remain unchanged.

DROP POLICY IF EXISTS "order_status_history_admin_all" ON public.order_status_history;
DROP POLICY IF EXISTS "order_status_history_staff_all" ON public.order_status_history;
CREATE POLICY "order_status_history_staff_all" ON public.order_status_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'seller')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'seller')
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
      AND p.role IN ('admin', 'seller')
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
      AND p.role IN ('admin', 'seller')
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
