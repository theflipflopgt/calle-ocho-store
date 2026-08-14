-- Commercial price integrity and product gallery limits.
-- This migration is additive: the legacy markup column remains available for rollback.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS desired_profit_amount NUMERIC(12,2) DEFAULT 0 NOT NULL;

ALTER TABLE public.product_color_images
  DROP CONSTRAINT IF EXISTS product_color_images_url_nonempty;

ALTER TABLE public.product_color_images
  ADD CONSTRAINT product_color_images_url_nonempty
  CHECK (length(trim(image_url)) > 0) NOT VALID;

-- Convert the previous percentage-based calculation into the profit amount that
-- was effectively left after invoice and Neo Link fees. No public price changes.
UPDATE public.products
SET desired_profit_amount = CASE
  WHEN invoice_fee_percent + neo_link_fee_percent < 100 THEN
    GREATEST(
      ROUND(
        (
          COALESCE(calculated_sale_price, base_price)
          * (1 - (invoice_fee_percent + neo_link_fee_percent) / 100)
          - cost_price
        )::NUMERIC,
        2
      ),
      0
    )
  ELSE GREATEST(COALESCE(sale_price_markup_percent, 0), 0)
END;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_commercial_amounts_valid;

ALTER TABLE public.products
  ADD CONSTRAINT products_commercial_amounts_valid
  CHECK (
    cost_price >= 0
    AND invoice_fee_percent >= 0
    AND neo_link_fee_percent >= 0
    AND invoice_fee_percent + neo_link_fee_percent < 100
    AND sale_price_markup_percent >= 0
    AND desired_profit_amount >= 0
    AND (calculated_sale_price IS NULL OR calculated_sale_price >= 0)
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.enforce_product_commercial_values()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compatibility with the previously deployed admin RPC, which only writes
  -- sale_price_markup_percent. New code writes desired_profit_amount directly.
  IF TG_OP = 'INSERT' THEN
    IF NEW.desired_profit_amount = 0 AND NEW.sale_price_markup_percent > 0 THEN
      NEW.desired_profit_amount := NEW.sale_price_markup_percent;
    END IF;
  ELSIF NEW.sale_price_markup_percent IS DISTINCT FROM OLD.sale_price_markup_percent
    AND NEW.desired_profit_amount IS NOT DISTINCT FROM OLD.desired_profit_amount THEN
    NEW.desired_profit_amount := NEW.sale_price_markup_percent;
  END IF;

  IF NEW.cost_price < 0 OR NEW.desired_profit_amount < 0
    OR NEW.invoice_fee_percent < 0 OR NEW.neo_link_fee_percent < 0 THEN
    RAISE EXCEPTION 'INVALID_COMMERCIAL_AMOUNT';
  END IF;

  IF NEW.invoice_fee_percent + NEW.neo_link_fee_percent >= 100 THEN
    RAISE EXCEPTION 'COMMERCIAL_FEES_MUST_BE_BELOW_100';
  END IF;

  NEW.calculated_sale_price := ROUND(
    (
      (NEW.cost_price + NEW.desired_profit_amount)
      / (1 - (NEW.invoice_fee_percent + NEW.neo_link_fee_percent) / 100)
    )::NUMERIC,
    2
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_product_commercial_values() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_products_commercial_values ON public.products;
CREATE TRIGGER trg_products_commercial_values
BEFORE INSERT OR UPDATE OF
  cost_price,
  invoice_fee_percent,
  neo_link_fee_percent,
  desired_profit_amount,
  sale_price_markup_percent,
  calculated_sale_price
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.enforce_product_commercial_values();

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
    SELECT DISTINCT value FROM unnest(v_color_ids) AS ids(value) WHERE value IS NOT NULL
  LOOP
    IF EXISTS (SELECT 1 FROM public.product_colors WHERE id = v_color_id) THEN
      SELECT count(*) INTO v_image_count
      FROM public.product_color_images
      WHERE product_color_id = v_color_id
        AND length(trim(image_url)) > 0;

      IF v_image_count < 1 OR v_image_count > 5 THEN
        RAISE EXCEPTION 'PRODUCT_COLOR_REQUIRES_1_TO_5_IMAGES';
      END IF;
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_product_color_image_count() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_product_colors_image_count ON public.product_colors;
CREATE CONSTRAINT TRIGGER trg_product_colors_image_count
AFTER INSERT OR UPDATE ON public.product_colors
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.enforce_product_color_image_count();

DROP TRIGGER IF EXISTS trg_product_color_images_count ON public.product_color_images;
CREATE CONSTRAINT TRIGGER trg_product_color_images_count
AFTER INSERT OR UPDATE OR DELETE ON public.product_color_images
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.enforce_product_color_image_count();

COMMENT ON COLUMN public.products.desired_profit_amount IS
  'Profit amount in GTQ before invoice and Neo Link fees; this is not FEL tax.';

COMMENT ON COLUMN public.products.invoice_fee_percent IS
  'Commercial invoice/FEL operating cost percentage; this is not orders.tax_amount.';
