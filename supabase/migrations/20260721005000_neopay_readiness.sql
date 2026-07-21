-- NeoPay / NeoNet payment readiness.
-- No card data is stored. The application must use NeoPay-hosted fields or
-- tokenization according to the official integration guide.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_authorization_code TEXT,
  ADD COLUMN IF NOT EXISTS card_brand TEXT,
  ADD COLUMN IF NOT EXISTS card_last4 TEXT,
  ADD COLUMN IF NOT EXISTS installments INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS payments_order_provider_idx
  ON public.payments(order_id, provider);

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_card_last4_format;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_card_last4_format
  CHECK (card_last4 IS NULL OR card_last4 ~ '^[0-9]{4}$');

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_installments_positive;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_installments_positive
  CHECK (installments IS NULL OR installments > 0);

COMMENT ON COLUMN public.payments.card_last4 IS
  'Only the last four digits returned by the gateway. Never store PAN or CVV.';
COMMENT ON COLUMN public.payments.provider_authorization_code IS
  'Authorization code returned by NeoPay after an approved transaction.';

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
  IF p_payment_method NOT IN ('bank_transfer', 'card', 'neocuotas') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
  END IF;

  -- Gateway methods remain server-blocked until NeoNet credentials,
  -- official request signing and certification are complete.
  IF p_payment_method IN ('card', 'neocuotas') THEN
    RAISE EXCEPTION 'PAYMENT_GATEWAY_NOT_CONFIGURED';
  END IF;

  v_result := public.create_manual_order(p_shipping, p_customer_notes, p_coupon_code);
  v_order_id := (v_result ->> 'orderId')::UUID;

  UPDATE public.payments
  SET
    payment_method = p_payment_method,
    provider = CASE WHEN p_payment_method = 'bank_transfer' THEN 'manual' ELSE 'neopay' END,
    payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
      'mode', CASE WHEN p_payment_method = 'bank_transfer' THEN 'manual' ELSE 'gateway' END,
      'selected_method', p_payment_method
    ),
    updated_at = now()
  WHERE order_id = v_order_id;

  RETURN v_result || jsonb_build_object('paymentMethod', p_payment_method);
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order(JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(JSONB, TEXT, TEXT, TEXT) TO authenticated;
