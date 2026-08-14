-- Calle Ocho commercial admin phase 1.
-- Product commercial fields, inventory import audit, payment methods,
-- seller attribution, and loyalty points foundation.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS invoice_fee_percent NUMERIC(6,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS neo_link_fee_percent NUMERIC(6,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS sale_price_markup_percent NUMERIC(6,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS desired_profit_amount NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS calculated_sale_price NUMERIC(12,2);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_commercial_amounts_valid;

ALTER TABLE public.products
  ADD CONSTRAINT products_commercial_amounts_valid
  CHECK (
    cost_price >= 0
    AND invoice_fee_percent >= 0
    AND neo_link_fee_percent >= 0
    AND sale_price_markup_percent >= 0
    AND desired_profit_amount >= 0
    AND invoice_fee_percent + neo_link_fee_percent < 100
    AND (calculated_sale_price IS NULL OR calculated_sale_price >= 0)
  ) NOT VALID;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_commission_rate NUMERIC(6,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS seller_commission_amount NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_link_sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_link_whatsapp_message_id TEXT;

CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON public.orders(seller_id);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  requires_payment_link BOOLEAN NOT NULL DEFAULT false,
  supports_installments BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_public_select_enabled" ON public.payment_methods;
CREATE POLICY "payment_methods_public_select_enabled" ON public.payment_methods
FOR SELECT
USING (is_enabled = true AND is_public = true);

DROP POLICY IF EXISTS "payment_methods_admin_all" ON public.payment_methods;
CREATE POLICY "payment_methods_admin_all" ON public.payment_methods
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

INSERT INTO public.payment_methods (
  id,
  label,
  description,
  provider,
  is_enabled,
  is_public,
  display_order,
  requires_payment_link,
  supports_installments
)
VALUES
  ('bank_transfer', 'Transferencia bancaria', 'Reserva el pedido y paga por transferencia.', 'manual', true, true, 10, false, false),
  ('cash_on_delivery', 'Pago contra entrega', 'Disponible solo para zonas con mensajeria propia.', 'manual', false, true, 20, false, false),
  ('neo_link_direct', 'Neo Link pago directo', 'Se envia un enlace de pago por WhatsApp al confirmar el pedido.', 'neo_link', true, true, 30, true, false),
  ('neo_link_installments', 'Neo Link con cuotas', 'Se envia un enlace de pago en cuotas por WhatsApp al confirmar el pedido.', 'neo_link', true, true, 40, true, true),
  ('card', 'Tarjeta NeoPay', 'Reservado para la integracion NeoPay completa.', 'neopay', false, false, 90, false, false),
  ('neocuotas', 'NeoCuotas', 'Reservado para la integracion NeoPay completa.', 'neopay', false, false, 100, false, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  provider = EXCLUDED.provider,
  display_order = EXCLUDED.display_order,
  requires_payment_link = EXCLUDED.requires_payment_link,
  supports_installments = EXCLUDED.supports_installments,
  updated_at = now();

CREATE TABLE IF NOT EXISTS public.inventory_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'previewed',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ
);

ALTER TABLE public.inventory_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_import_batches_staff_all" ON public.inventory_import_batches;
CREATE POLICY "inventory_import_batches_staff_all" ON public.inventory_import_batches
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse')
  )
);

CREATE TABLE IF NOT EXISTS public.inventory_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.inventory_import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  action TEXT NOT NULL DEFAULT 'skip',
  errors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  warnings TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_import_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_import_rows_staff_all" ON public.inventory_import_rows;
CREATE POLICY "inventory_import_rows_staff_all" ON public.inventory_import_rows
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'warehouse')
  )
);

CREATE TABLE IF NOT EXISTS public.seller_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seller_id)
);

ALTER TABLE public.seller_commission_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_commission_rules_admin_all" ON public.seller_commission_rules;
CREATE POLICY "seller_commission_rules_admin_all" ON public.seller_commission_rules
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE TABLE IF NOT EXISTS public.loyalty_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_points_customer_select_own" ON public.loyalty_points_ledger;
CREATE POLICY "loyalty_points_customer_select_own" ON public.loyalty_points_ledger
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "loyalty_points_admin_all" ON public.loyalty_points_ledger;
CREATE POLICY "loyalty_points_admin_all" ON public.loyalty_points_ledger
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE OR REPLACE VIEW public.customer_points_summary AS
SELECT
  user_id,
  COALESCE(SUM(points), 0)::INTEGER AS points_balance,
  MAX(created_at) AS last_points_at
FROM public.loyalty_points_ledger
GROUP BY user_id;
