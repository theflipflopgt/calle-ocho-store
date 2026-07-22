-- Warehouse role for product catalog and inventory operations.
-- This role can create/edit product catalog data, brands, categories and inventory,
-- but it should not access orders, customers, coupons, configuration or delete products.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'seller', 'warehouse'));

DROP POLICY IF EXISTS "products_staff_select" ON public.products;
CREATE POLICY "products_staff_select" ON public.products
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "products_staff_insert" ON public.products;
CREATE POLICY "products_staff_insert" ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "products_staff_update" ON public.products;
CREATE POLICY "products_staff_update" ON public.products
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "product_colors_staff_select" ON public.product_colors;
CREATE POLICY "product_colors_staff_select" ON public.product_colors
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_colors_staff_insert" ON public.product_colors;
CREATE POLICY "product_colors_staff_insert" ON public.product_colors
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_colors_staff_update" ON public.product_colors;
CREATE POLICY "product_colors_staff_update" ON public.product_colors
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_colors_admin_delete" ON public.product_colors;
CREATE POLICY "product_colors_admin_delete" ON public.product_colors
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "product_variants_staff_select" ON public.product_variants;
CREATE POLICY "product_variants_staff_select" ON public.product_variants
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'seller', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_variants_staff_insert" ON public.product_variants;
CREATE POLICY "product_variants_staff_insert" ON public.product_variants
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_variants_staff_update" ON public.product_variants;
CREATE POLICY "product_variants_staff_update" ON public.product_variants
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;
CREATE POLICY "product_variants_admin_delete" ON public.product_variants
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "product_color_images_staff_select" ON public.product_color_images;
CREATE POLICY "product_color_images_staff_select" ON public.product_color_images
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_color_images_staff_insert" ON public.product_color_images;
CREATE POLICY "product_color_images_staff_insert" ON public.product_color_images
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_color_images_staff_update" ON public.product_color_images;
CREATE POLICY "product_color_images_staff_update" ON public.product_color_images
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "product_color_images_admin_delete" ON public.product_color_images;
CREATE POLICY "product_color_images_admin_delete" ON public.product_color_images
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "brands_staff_select" ON public.brands;
CREATE POLICY "brands_staff_select" ON public.brands
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "brands_staff_insert" ON public.brands;
CREATE POLICY "brands_staff_insert" ON public.brands
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "brands_staff_update" ON public.brands;
CREATE POLICY "brands_staff_update" ON public.brands
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "brands_admin_delete" ON public.brands;
CREATE POLICY "brands_admin_delete" ON public.brands
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "categories_staff_select" ON public.categories;
CREATE POLICY "categories_staff_select" ON public.categories
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "categories_staff_insert" ON public.categories;
CREATE POLICY "categories_staff_insert" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "categories_staff_update" ON public.categories;
CREATE POLICY "categories_staff_update" ON public.categories
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'warehouse')
  )
);

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
