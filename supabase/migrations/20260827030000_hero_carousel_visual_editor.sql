BEGIN;
ALTER TABLE public.featured_products
  ADD COLUMN IF NOT EXISTS design_config JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.featured_products DROP CONSTRAINT IF EXISTS featured_products_design_config_object;
ALTER TABLE public.featured_products ADD CONSTRAINT featured_products_design_config_object
  CHECK (jsonb_typeof(design_config) = 'object');
COMMENT ON COLUMN public.featured_products.design_config IS
  'Colores, tipografia, tamanos y posiciones configurables del slide del Hero Carousel.';
COMMIT;
