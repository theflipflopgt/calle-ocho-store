-- Reinstalls the inventory commit RPC used by the mass Excel importer.
-- Safe to run more than once. Does not delete or alter existing products.
-- Keeps authorization inside PostgreSQL via auth.uid() and staff roles.

CREATE OR REPLACE FUNCTION public.commit_inventory_import(p_batch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_batch RECORD;
  v_row RECORD;
  v_data JSONB;
  v_brand_id UUID;
  v_category_id UUID;
  v_product_id UUID;
  v_color_id UUID;
  v_variant_id UUID;
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_processed INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_actor_id;
  IF v_role NOT IN ('admin', 'warehouse') THEN RAISE EXCEPTION 'PRODUCT_STAFF_ONLY'; END IF;

  SELECT * INTO v_batch FROM public.inventory_import_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'IMPORT_BATCH_NOT_FOUND'; END IF;
  IF v_role <> 'admin' AND v_batch.created_by IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'IMPORT_BATCH_NOT_OWNED';
  END IF;
  IF v_batch.status = 'committed' THEN
    RETURN jsonb_build_object('processed', 0, 'skipped', v_batch.error_rows, 'replayed', true);
  END IF;
  IF v_batch.status NOT IN ('previewed', 'failed') THEN RAISE EXCEPTION 'IMPORT_BATCH_NOT_READY'; END IF;

  UPDATE public.inventory_import_batches SET status = 'processing' WHERE id = p_batch_id;

  FOR v_row IN
    SELECT * FROM public.inventory_import_rows WHERE batch_id = p_batch_id ORDER BY row_number FOR UPDATE
  LOOP
    IF cardinality(v_row.errors) > 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;
    v_data := v_row.normalized_data;

    INSERT INTO public.brands(name, slug, is_active)
    VALUES (trim(v_data ->> 'marca'), lower(regexp_replace(trim(v_data ->> 'marca'), '[^a-zA-Z0-9]+', '-', 'g')), true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
    RETURNING id INTO v_brand_id;

    INSERT INTO public.categories(name, slug, is_active)
    VALUES (trim(v_data ->> 'categoria'), lower(regexp_replace(trim(v_data ->> 'categoria'), '[^a-zA-Z0-9]+', '-', 'g')), true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
    RETURNING id INTO v_category_id;

    SELECT id INTO v_product_id FROM public.products
    WHERE sku = v_data ->> 'codigo_producto' OR slug = v_data ->> 'slug'
    ORDER BY CASE WHEN sku = v_data ->> 'codigo_producto' THEN 0 ELSE 1 END LIMIT 1 FOR UPDATE;

    IF v_product_id IS NULL THEN
      INSERT INTO public.products(
        brand_id, category_id, name, slug, sku, description, base_price, compare_at_price,
        status, gender, cost_price, invoice_fee_percent, neo_link_fee_percent,
        desired_profit_amount, calculated_sale_price
      ) VALUES (
        v_brand_id, v_category_id, v_data ->> 'nombre', v_data ->> 'slug',
        v_data ->> 'codigo_producto', NULLIF(v_data ->> 'descripcion', ''),
        (v_data ->> 'precio_final_calculado')::NUMERIC,
        NULLIF(v_data ->> 'precio_anterior', '')::NUMERIC,
        COALESCE(v_data ->> 'estado', 'draft'),
        CASE v_data ->> 'seccion' WHEN 'hombre' THEN 'men' WHEN 'mujer' THEN 'women' WHEN 'ninos' THEN 'kids' ELSE 'unisex' END,
        COALESCE((v_data ->> 'costo')::NUMERIC, 0),
        COALESCE((v_data ->> 'porcentaje_factura')::NUMERIC, 0),
        COALESCE((v_data ->> 'porcentaje_neo_link')::NUMERIC, 0),
        COALESCE(
          (v_data ->> 'ganancia_deseada')::NUMERIC,
          (v_data ->> 'porcentaje_margen')::NUMERIC,
          0
        ),
        (v_data ->> 'precio_final_calculado')::NUMERIC
      ) RETURNING id INTO v_product_id;
    ELSE
      UPDATE public.products SET
        brand_id = v_brand_id, category_id = v_category_id,
        name = v_data ->> 'nombre', description = NULLIF(v_data ->> 'descripcion', ''),
        base_price = (v_data ->> 'precio_final_calculado')::NUMERIC,
        compare_at_price = NULLIF(v_data ->> 'precio_anterior', '')::NUMERIC,
        status = COALESCE(v_data ->> 'estado', 'draft'),
        gender = CASE v_data ->> 'seccion' WHEN 'hombre' THEN 'men' WHEN 'mujer' THEN 'women' WHEN 'ninos' THEN 'kids' ELSE 'unisex' END,
        cost_price = COALESCE((v_data ->> 'costo')::NUMERIC, 0),
        invoice_fee_percent = COALESCE((v_data ->> 'porcentaje_factura')::NUMERIC, 0),
        neo_link_fee_percent = COALESCE((v_data ->> 'porcentaje_neo_link')::NUMERIC, 0),
        desired_profit_amount = COALESCE(
          (v_data ->> 'ganancia_deseada')::NUMERIC,
          (v_data ->> 'porcentaje_margen')::NUMERIC,
          0
        ),
        calculated_sale_price = (v_data ->> 'precio_final_calculado')::NUMERIC,
        updated_at = now()
      WHERE id = v_product_id;
    END IF;

    SELECT id INTO v_color_id FROM public.product_colors
    WHERE product_id = v_product_id AND lower(color_name) = lower(v_data ->> 'color')
    LIMIT 1 FOR UPDATE;
    IF v_color_id IS NULL THEN
      INSERT INTO public.product_colors(product_id, color_name, color_code, sku_suffix, is_available)
      VALUES (
        v_product_id, v_data ->> 'color', COALESCE(NULLIF(v_data ->> 'codigo_color', ''), '#000000'),
        v_data ->> 'colorSkuSuffix', true
      ) RETURNING id INTO v_color_id;
    ELSE
      UPDATE public.product_colors SET
        color_code = COALESCE(NULLIF(v_data ->> 'codigo_color', ''), '#000000'),
        sku_suffix = v_data ->> 'colorSkuSuffix', is_available = true, updated_at = now()
      WHERE id = v_color_id;
    END IF;

    IF COALESCE(v_data ->> 'link_imagen_cloudinary', '') <> '' AND NOT EXISTS (
      SELECT 1 FROM public.product_color_images
      WHERE product_color_id = v_color_id AND image_url = v_data ->> 'link_imagen_cloudinary'
    ) THEN
      INSERT INTO public.product_color_images(product_color_id, image_url, alt_text, image_type)
      VALUES (v_color_id, v_data ->> 'link_imagen_cloudinary', v_data ->> 'nombre', 'front');
    END IF;

    v_new_stock := COALESCE((v_data ->> 'stock')::INTEGER, 0);
    SELECT id, stock_quantity INTO v_variant_id, v_old_stock FROM public.product_variants
    WHERE sku = v_data ->> 'sku_variante' FOR UPDATE;

    IF v_variant_id IS NULL THEN
      INSERT INTO public.product_variants(
        product_id, product_color_id, size_us, size_eu, size_uk, size_cm, sku,
        stock_quantity, low_stock_threshold, price_override, is_available
      ) VALUES (
        v_product_id, v_color_id, (v_data ->> 'talla_us')::NUMERIC,
        COALESCE((v_data ->> 'talla_eu')::NUMERIC, 0), COALESCE((v_data ->> 'talla_uk')::NUMERIC, 0),
        COALESCE((v_data ->> 'talla_cm')::NUMERIC, 0), v_data ->> 'sku_variante',
        v_new_stock, COALESCE((v_data ->> 'stock_minimo')::INTEGER, 5),
        NULLIF(v_data ->> 'precio_especial_talla', '')::NUMERIC, v_new_stock > 0
      ) RETURNING id INTO v_variant_id;
      v_old_stock := 0;
    ELSE
      UPDATE public.product_variants SET
        product_id = v_product_id, product_color_id = v_color_id,
        size_us = (v_data ->> 'talla_us')::NUMERIC,
        size_eu = COALESCE((v_data ->> 'talla_eu')::NUMERIC, 0),
        size_uk = COALESCE((v_data ->> 'talla_uk')::NUMERIC, 0),
        size_cm = COALESCE((v_data ->> 'talla_cm')::NUMERIC, 0),
        stock_quantity = v_new_stock,
        low_stock_threshold = COALESCE((v_data ->> 'stock_minimo')::INTEGER, 5),
        price_override = NULLIF(v_data ->> 'precio_especial_talla', '')::NUMERIC,
        is_available = v_new_stock > 0, updated_at = now()
      WHERE id = v_variant_id;
    END IF;

    IF v_new_stock <> v_old_stock THEN
      INSERT INTO public.inventory_movements(
        variant_id, movement_type, quantity_delta, balance_after, reason, created_by
      ) VALUES (
        v_variant_id, 'import', v_new_stock - v_old_stock, v_new_stock,
        'Importacion de inventario ' || p_batch_id::text, v_actor_id
      );
    END IF;
    v_processed := v_processed + 1;
  END LOOP;

  UPDATE public.inventory_import_batches SET
    status = 'committed', committed_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object('processed', v_processed, 'skipped', v_skipped, 'replayed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.commit_inventory_import(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.commit_inventory_import(UUID) TO authenticated;
