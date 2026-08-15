-- FEL readiness: capture the billing NIT as an immutable order snapshot.
-- This does not issue FEL documents or connect to a certifier yet.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS billing_nit TEXT;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_billing_nit_format_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_billing_nit_format_check
  CHECK (
    billing_nit IS NULL
    OR billing_nit = ''
    OR upper(billing_nit) = 'CF'
    OR billing_nit ~ '^[0-9]+(-[0-9Kk])?$'
  );

COMMENT ON COLUMN public.orders.billing_nit IS
  'NIT captured at checkout for future FEL invoicing. Stored on the order as a billing snapshot.';

NOTIFY pgrst, 'reload schema';
