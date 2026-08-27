BEGIN;

ALTER TABLE public.featured_products
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS brand_text TEXT,
  ADD COLUMN IF NOT EXISTS title_text TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_text TEXT,
  ADD COLUMN IF NOT EXISTS price_text TEXT,
  ADD COLUMN IF NOT EXISTS primary_button_text TEXT,
  ADD COLUMN IF NOT EXISTS secondary_button_text TEXT,
  ADD COLUMN IF NOT EXISTS show_badge BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_brand BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_title BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_subtitle BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_price BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_primary_button BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_secondary_button BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.featured_products
  DROP CONSTRAINT IF EXISTS featured_products_badge_text_length,
  DROP CONSTRAINT IF EXISTS featured_products_brand_text_length,
  DROP CONSTRAINT IF EXISTS featured_products_title_text_length,
  DROP CONSTRAINT IF EXISTS featured_products_subtitle_text_length,
  DROP CONSTRAINT IF EXISTS featured_products_price_text_length,
  DROP CONSTRAINT IF EXISTS featured_products_primary_button_text_length,
  DROP CONSTRAINT IF EXISTS featured_products_secondary_button_text_length;

ALTER TABLE public.featured_products
  ADD CONSTRAINT featured_products_badge_text_length CHECK (char_length(badge_text) <= 40),
  ADD CONSTRAINT featured_products_brand_text_length CHECK (char_length(brand_text) <= 60),
  ADD CONSTRAINT featured_products_title_text_length CHECK (char_length(title_text) <= 100),
  ADD CONSTRAINT featured_products_subtitle_text_length CHECK (char_length(subtitle_text) <= 160),
  ADD CONSTRAINT featured_products_price_text_length CHECK (char_length(price_text) <= 40),
  ADD CONSTRAINT featured_products_primary_button_text_length CHECK (char_length(primary_button_text) <= 32),
  ADD CONSTRAINT featured_products_secondary_button_text_length CHECK (char_length(secondary_button_text) <= 32);

COMMENT ON COLUMN public.featured_products.price_text IS
  'Texto visual opcional del precio en el hero. El precio real del checkout siempre se calcula desde el producto.';

COMMIT;
