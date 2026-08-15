-- Allow products/colors to exist without images.
-- Images are optional during inventory import and can be added later.
-- Keeps the existing maximum of 5 images per product color.

CREATE OR REPLACE FUNCTION public.enforce_product_color_image_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_color_id UUID;
  v_color_ids UUID[] := ARRAY[]::UUID[];
  v_image_count INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'product_colors' THEN
    IF TG_OP = 'DELETE' THEN
      v_color_ids := array_append(v_color_ids, OLD.id);
    ELSE
      v_color_ids := array_append(v_color_ids, NEW.id);
    END IF;
  ELSE
    IF TG_OP <> 'DELETE' THEN
      v_color_ids := array_append(v_color_ids, NEW.product_color_id);
    END IF;

    IF TG_OP <> 'INSERT' THEN
      v_color_ids := array_append(v_color_ids, OLD.product_color_id);
    END IF;
  END IF;

  FOR v_color_id IN
    SELECT DISTINCT value
    FROM unnest(v_color_ids) AS ids(value)
    WHERE value IS NOT NULL
  LOOP
    IF EXISTS (
      SELECT 1
      FROM public.product_colors
      WHERE id = v_color_id
    ) THEN
      SELECT count(*)
      INTO v_image_count
      FROM public.product_color_images
      WHERE product_color_id = v_color_id
        AND length(trim(image_url)) > 0;

      -- Images are optional. Only enforce the upper limit.
      IF v_image_count > 5 THEN
        RAISE EXCEPTION 'PRODUCT_COLOR_MAX_5_IMAGES';
      END IF;
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL
ON FUNCTION public.enforce_product_color_image_count()
FROM PUBLIC;
