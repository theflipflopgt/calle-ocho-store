-- Compact audit trail for staff mutations. It stores field names, never full row values.

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('admin', 'seller', 'warehouse')),
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changed_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_activity_logs_actor_created_idx
  ON public.admin_activity_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_logs_entity_created_idx
  ON public.admin_activity_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_logs_created_idx
  ON public.admin_activity_logs(created_at DESC);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_logs_admin_read" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_admin_read"
ON public.admin_activity_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

GRANT SELECT ON public.admin_activity_logs TO authenticated;

-- Customers may create and read their own request, but may not approve or resolve it.
DROP POLICY IF EXISTS "returns_customer_own" ON public.return_requests;
DROP POLICY IF EXISTS "returns_customer_read_own" ON public.return_requests;
CREATE POLICY "returns_customer_read_own"
ON public.return_requests
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "returns_customer_create_own" ON public.return_requests;
CREATE POLICY "returns_customer_create_own"
ON public.return_requests
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'requested'
  AND resolution_notes IS NULL
  AND resolved_at IS NULL
  AND resolved_by IS NULL
);

CREATE OR REPLACE FUNCTION public.audit_staff_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_role TEXT;
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::JSONB ELSE to_jsonb(OLD) END;
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::JSONB ELSE to_jsonb(NEW) END;
  v_fields TEXT[] := ARRAY[]::TEXT[];
  v_entity_id UUID;
BEGIN
  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF v_actor_role IS NULL OR v_actor_role NOT IN ('admin', 'seller', 'warehouse') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::TEXT[])
    INTO v_fields
    FROM jsonb_object_keys(v_old || v_new) AS changed(key)
    WHERE key NOT IN ('updated_at')
      AND v_old -> key IS DISTINCT FROM v_new -> key;

    IF cardinality(v_fields) = 0 THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    v_fields := ARRAY['created'];
  ELSE
    v_fields := ARRAY['deleted'];
  END IF;

  BEGIN
    v_entity_id := COALESCE(v_new ->> 'id', v_old ->> 'id')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_entity_id := NULL;
  END;

  INSERT INTO public.admin_activity_logs(
    actor_id, actor_role, action, entity_type, entity_id, changed_fields
  ) VALUES (
    v_actor_id, v_actor_role, lower(TG_OP), TG_TABLE_NAME, v_entity_id, v_fields
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_staff_mutation() FROM PUBLIC;

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'products',
    'product_variants',
    'inventory_movements',
    'orders',
    'shipments',
    'return_requests',
    'seller_commission_rules'
  ]
  LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_audit_staff_' || v_table, v_table);
      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_staff_mutation()',
        'trg_audit_staff_' || v_table,
        v_table
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_admin_activity_logs(p_keep_days INTEGER DEFAULT 365)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  IF p_keep_days < 90 THEN
    RAISE EXCEPTION 'La retención mínima es de 90 días';
  END IF;

  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM public.admin_activity_logs
  WHERE created_at < now() - make_interval(days => p_keep_days);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_admin_activity_logs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_admin_activity_logs(INTEGER) TO authenticated, service_role;
