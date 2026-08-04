-- Remove the recursive profiles policy that can hide every staff role.

DROP POLICY IF EXISTS "profiles_seller_read_customers" ON public.profiles;

CREATE OR REPLACE FUNCTION public.seller_can_read_customer(p_customer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.profiles seller ON seller.id = auth.uid()
    WHERE o.user_id = p_customer_id
      AND o.seller_id = auth.uid()
      AND seller.role = 'seller'
  );
$$;

REVOKE ALL ON FUNCTION public.seller_can_read_customer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_can_read_customer(UUID) TO authenticated;

CREATE POLICY "profiles_seller_read_customers" ON public.profiles
FOR SELECT TO authenticated
USING (public.seller_can_read_customer(id));
