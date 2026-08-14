-- Trace the current seller assignment and every reassignment without changing order totals.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_assigned_at TIMESTAMPTZ;

UPDATE public.orders
SET seller_assigned_at = COALESCE(seller_assigned_at, created_at, now())
WHERE seller_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_seller_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignment_source TEXT NOT NULL
    CHECK (assignment_source IN ('automatic', 'manual', 'legacy')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_seller_assignments_order_idx
  ON public.order_seller_assignments(order_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS order_seller_assignments_seller_idx
  ON public.order_seller_assignments(seller_id, assigned_at DESC);

INSERT INTO public.order_seller_assignments(
  order_id,
  previous_seller_id,
  seller_id,
  assigned_by,
  assignment_source,
  assigned_at
)
SELECT
  o.id,
  NULL,
  o.seller_id,
  NULL,
  'legacy',
  COALESCE(o.seller_assigned_at, o.created_at, now())
FROM public.orders o
WHERE o.seller_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.order_seller_assignments osa
    WHERE osa.order_id = o.id
  );

CREATE OR REPLACE FUNCTION public.set_order_seller_assignment_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.seller_id IS NOT NULL AND NEW.seller_assigned_at IS NULL THEN
      NEW.seller_assigned_at := now();
    END IF;
  ELSIF NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    NEW.seller_assigned_at := CASE WHEN NEW.seller_id IS NULL THEN NULL ELSE now() END;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_order_seller_assignment_timestamp() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.log_order_seller_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_role TEXT;
  v_source TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.seller_id IS NOT DISTINCT FROM OLD.seller_id THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.seller_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  v_source := CASE WHEN v_actor_role = 'admin' THEN 'manual' ELSE 'automatic' END;

  INSERT INTO public.order_seller_assignments(
    order_id,
    previous_seller_id,
    seller_id,
    assigned_by,
    assignment_source,
    assigned_at
  ) VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.seller_id ELSE NULL END,
    NEW.seller_id,
    CASE WHEN v_actor_role IN ('admin', 'seller', 'warehouse') THEN v_actor_id ELSE NULL END,
    v_source,
    COALESCE(NEW.seller_assigned_at, now())
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_order_seller_assignment() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_orders_seller_assignment_timestamp ON public.orders;
CREATE TRIGGER trg_orders_seller_assignment_timestamp
BEFORE INSERT OR UPDATE OF seller_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_seller_assignment_timestamp();

DROP TRIGGER IF EXISTS trg_orders_seller_assignment_log ON public.orders;
CREATE TRIGGER trg_orders_seller_assignment_log
AFTER INSERT OR UPDATE OF seller_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_seller_assignment();

ALTER TABLE public.order_seller_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_seller_assignments_admin_read" ON public.order_seller_assignments;
CREATE POLICY "order_seller_assignments_admin_read"
ON public.order_seller_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "order_seller_assignments_seller_read_own" ON public.order_seller_assignments;
CREATE POLICY "order_seller_assignments_seller_read_own"
ON public.order_seller_assignments
FOR SELECT TO authenticated
USING (
  seller_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'seller'
  )
);

GRANT SELECT ON public.order_seller_assignments TO authenticated;
