-- Normalize manual checkout payments to bank transfer.
-- Existing checkout code historically inserted manual payments as cash_on_delivery.
-- The storefront only exposes bank transfer, so pending manual checkout payments
-- should be shown and handled as bank_transfer.

UPDATE public.payments
SET
  payment_method = 'bank_transfer',
  payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
    'selected_method', 'bank_transfer',
    'contact_channel', 'whatsapp',
    'requires_manual_confirmation', true
  )
WHERE payment_method = 'cash_on_delivery'
  AND status = 'pending'
  AND COALESCE(payment_details ->> 'created_from', '') IN ('checkout', 'guest_checkout');
