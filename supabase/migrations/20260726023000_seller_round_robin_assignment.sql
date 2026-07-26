-- Assign new orders to sellers with a round-robin queue.
-- Uses profiles.role = 'seller' as the active seller pool.

CREATE TABLE IF NOT EXISTS public.sales_assignment_queue (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  last_seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.sales_assignment_queue (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.sales_assignment_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_assignment_queue_admin_all" ON public.sales_assignment_queue;
CREATE POLICY "sales_assignment_queue_admin_all" ON public.sales_assignment_queue
FOR ALL
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

CREATE OR REPLACE FUNCTION public.assign_order_to_next_seller(p_order_id UUID)
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
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  INSERT INTO public.sales_assignment_queue (singleton)
  VALUES (true)
  ON CONFLICT (singleton) DO NOTHING;

  SELECT last_seller_id
  INTO v_last_seller_id
  FROM public.sales_assignment_queue
  WHERE singleton = true
  FOR UPDATE;

  WITH sellers AS (
    SELECT
      id,
      row_number() OVER (ORDER BY COALESCE(full_name, email, id::text), id) AS position
    FROM public.profiles
    WHERE role = 'seller'
  )
  SELECT position
  INTO v_last_position
  FROM sellers
  WHERE id = v_last_seller_id;

  WITH sellers AS (
    SELECT
      id,
      row_number() OVER (ORDER BY COALESCE(full_name, email, id::text), id) AS position
    FROM public.profiles
    WHERE role = 'seller'
  )
  SELECT id
  INTO v_next_seller_id
  FROM sellers
  WHERE v_last_position IS NULL OR position > v_last_position
  ORDER BY position
  LIMIT 1;

  IF v_next_seller_id IS NULL THEN
    SELECT id
    INTO v_next_seller_id
    FROM public.profiles
    WHERE role = 'seller'
    ORDER BY COALESCE(full_name, email, id::text), id
    LIMIT 1;
  END IF;

  IF v_next_seller_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT commission_rate
  INTO v_commission_rate
  FROM public.seller_commission_rules
  WHERE seller_id = v_next_seller_id
    AND is_active = true
  LIMIT 1;

  UPDATE public.orders
  SET
    seller_id = v_next_seller_id,
    seller_commission_rate = COALESCE(v_commission_rate, 0),
    seller_commission_amount = ROUND((total * COALESCE(v_commission_rate, 0) / 100)::numeric, 2)
  WHERE id = p_order_id
    AND seller_id IS NULL;

  UPDATE public.sales_assignment_queue
  SET
    last_seller_id = v_next_seller_id,
    updated_at = now()
  WHERE singleton = true;

  RETURN v_next_seller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_order_to_next_seller(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_order_to_next_seller(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_order_to_next_seller(UUID) TO service_role;
