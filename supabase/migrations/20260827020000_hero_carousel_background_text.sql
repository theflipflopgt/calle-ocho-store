BEGIN;

ALTER TABLE public.featured_products
  ADD COLUMN IF NOT EXISTS background_text TEXT;

ALTER TABLE public.featured_products
  DROP CONSTRAINT IF EXISTS featured_products_background_text_length;

ALTER TABLE public.featured_products
  ADD CONSTRAINT featured_products_background_text_length
  CHECK (char_length(background_text) <= 60);

COMMENT ON COLUMN public.featured_products.background_text IS
  'Texto editorial grande que aparece sobre la fotografía del producto en el hero.';

COMMIT;
