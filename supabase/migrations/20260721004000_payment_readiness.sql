-- Payment readiness foundation for BAC Credomatic integration.
-- This migration does not process card data. Card details must always be collected
-- by the gateway-hosted form/tokenization flow, never by this application.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_unique
  ON public.payments(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS payments_provider_reference_idx
  ON public.payments(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_event_id)
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_events_admin_read" ON public.payment_events;
CREATE POLICY "payment_events_admin_read" ON public.payment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Wrapper around the hardened atomic order function. It validates and stores the
-- selected method without allowing the browser to write directly to payments.
CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_shipping JSONB,
  p_customer_notes TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'bank_transfer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_order_id UUID;
BEGIN
  IF p_payment_method NOT IN ('bank_transfer', 'card', 'visacuotas') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
  END IF;

  -- Card methods remain blocked until the server-side gateway adapter is enabled.
  IF p_payment_method IN ('card', 'visacuotas') THEN
    RAISE EXCEPTION 'PAYMENT_GATEWAY_NOT_CONFIGURED';
  END IF;

  v_result := public.create_manual_order(
    p_shipping,
    p_customer_notes,
    p_coupon_code
  );

  v_order_id := (v_result ->> 'orderId')::UUID;

  UPDATE public.payments
  SET
    payment_method = p_payment_method,
    provider = CASE WHEN p_payment_method = 'bank_transfer' THEN 'manual' ELSE 'bac_credomatic' END,
    payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
      'mode', CASE WHEN p_payment_method = 'bank_transfer' THEN 'manual' ELSE 'gateway' END,
      'selected_method', p_payment_method
    )
  WHERE order_id = v_order_id;

  RETURN v_result || jsonb_build_object('paymentMethod', p_payment_method);
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order(JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(JSONB, TEXT, TEXT, TEXT) TO authenticated;
