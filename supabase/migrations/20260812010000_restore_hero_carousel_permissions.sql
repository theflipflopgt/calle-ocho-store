BEGIN;

-- The storefront needs public read access to active carousel rows, while the
-- admin editor also needs table-level write privileges. RLS remains the layer
-- that limits those writes to administrators.
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.featured_products FROM anon, authenticated;
GRANT SELECT ON TABLE public.featured_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.featured_products TO authenticated;

DROP POLICY IF EXISTS "featured_products_public_read" ON public.featured_products;
CREATE POLICY "featured_products_public_read"
ON public.featured_products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "featured_products_admin_all" ON public.featured_products;
CREATE POLICY "featured_products_admin_all"
ON public.featured_products
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Keep the points summary protected by the RLS policies of its source table.
-- This also records the manual hardening in a reproducible migration.
CREATE OR REPLACE VIEW public.customer_points_summary
WITH (security_invoker = true)
AS
SELECT
  user_id,
  COALESCE(SUM(points), 0)::INTEGER AS points_balance,
  MAX(created_at) AS last_points_at
FROM public.loyalty_points_ledger
GROUP BY user_id;

REVOKE ALL ON TABLE public.customer_points_summary FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.customer_points_summary TO authenticated;

COMMIT;
