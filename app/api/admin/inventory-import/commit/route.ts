import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizedKey } from '@/lib/admin/inventory-import';
import { generateSlug } from '@/lib/utils/slug';
import { appLogger } from '@/lib/logger';

async function getOrCreateBrand(db: any, name: string) {
  const slug = generateSlug(name);
  const { data: existing } = await db.from('brands').select('id').eq('slug', slug).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await db
    .from('brands')
    .insert({ name, slug, is_active: true })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function getOrCreateCategory(db: any, name: string) {
  const slug = generateSlug(name);
  const { data: existing } = await db.from('categories').select('id').eq('slug', slug).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await db
    .from('categories')
    .insert({ name, slug, is_active: true })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function upsertProduct(db: any, row: any) {
  const brandId = await getOrCreateBrand(db, row.marca);
  const categoryId = await getOrCreateCategory(db, row.categoria);
  const productPayload = {
    brand_id: brandId,
    category_id: categoryId,
    name: row.nombre,
    slug: row.slug,
    sku: row.codigo_producto,
    description: row.descripcion || null,
    base_price: Number(row.precio_final_calculado),
    compare_at_price: row.precio_anterior ? Number(row.precio_anterior) : null,
    status: row.estado || 'draft',
    gender: row.seccion === 'hombre' ? 'men' : row.seccion === 'mujer' ? 'women' : row.seccion === 'ninos' ? 'kids' : 'unisex',
    cost_price: Number(row.costo || 0),
    invoice_fee_percent: Number(row.porcentaje_factura || 0),
    neo_link_fee_percent: Number(row.porcentaje_neo_link || 0),
    sale_price_markup_percent: Number(row.porcentaje_margen || 0),
    calculated_sale_price: Number(row.precio_final_calculado),
  };

  const { data: existing } = await db
    .from('products')
    .select('id')
    .or(`sku.eq.${row.codigo_producto},slug.eq.${row.slug}`)
    .maybeSingle();

  if (existing) {
    const { error } = await db.from('products').update(productPayload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await db.from('products').insert(productPayload).select('id').single();
  if (error) throw error;
  return data.id;
}

async function upsertColor(db: any, productId: string, row: any) {
  const { data: colors, error: findError } = await db
    .from('product_colors')
    .select('id, color_name')
    .eq('product_id', productId);

  if (findError) throw findError;

  const existing = (colors || []).find(
    (color: any) => normalizedKey(color.color_name) === normalizedKey(row.color)
  );

  const payload = {
    product_id: productId,
    color_name: row.color,
    color_code: row.codigo_color || '#000000',
    sku_suffix: row.colorSkuSuffix,
    is_available: true,
    display_order: 0,
  };

  if (existing) {
    const { error } = await db.from('product_colors').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await db.from('product_colors').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

async function upsertImage(db: any, colorId: string, row: any) {
  if (!row.link_imagen_cloudinary) return;

  const { data: existing } = await db
    .from('product_color_images')
    .select('id')
    .eq('product_color_id', colorId)
    .eq('image_url', row.link_imagen_cloudinary)
    .maybeSingle();

  if (existing) return;

  const { error } = await db.from('product_color_images').insert({
    product_color_id: colorId,
    image_url: row.link_imagen_cloudinary,
    alt_text: row.nombre,
    display_order: 0,
    image_type: 'front',
  });

  if (error) throw error;
}

async function upsertVariant(db: any, productId: string, colorId: string, row: any) {
  const payload = {
    product_id: productId,
    product_color_id: colorId,
    size_us: Number(row.talla_us),
    size_eu: Number(row.talla_eu || 0),
    size_uk: Number(row.talla_uk || 0),
    size_cm: Number(row.talla_cm || 0),
    sku: row.sku_variante,
    stock_quantity: Number(row.stock || 0),
    low_stock_threshold: Number(row.stock_minimo || 5),
    price_override: row.precio_especial_talla ? Number(row.precio_especial_talla) : null,
    is_available: row.isAvailable,
  };

  const { data: existing } = await db
    .from('product_variants')
    .select('id')
    .eq('sku', row.sku_variante)
    .maybeSingle();

  if (existing) {
    const { error } = await db.from('product_variants').update(payload).eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await db.from('product_variants').insert(payload);
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const { batchId } = await request.json().catch(() => ({ batchId: null }));
  if (!batchId) {
    return NextResponse.json({ error: 'Falta el lote de importacion.' }, { status: 400 });
  }

  const db = (createAdminClient() || auth.supabase) as any;
  const { data: batchRows, error: rowsError } = await db
    .from('inventory_import_rows')
    .select('id, normalized_data, errors')
    .eq('batch_id', batchId)
    .order('row_number', { ascending: true });

  if (rowsError) {
    return NextResponse.json({ error: 'No se pudo cargar la revision.' }, { status: 400 });
  }

  const validRows = (batchRows || []).filter((row: any) => row.errors.length === 0);
  let processed = 0;

  try {
    for (const item of validRows) {
      const row = item.normalized_data;
      const productId = await upsertProduct(db, row);
      const colorId = await upsertColor(db, productId, row);
      await upsertImage(db, colorId, row);
      await upsertVariant(db, productId, colorId, row);
      processed += 1;
    }

    await db
      .from('inventory_import_batches')
      .update({ status: 'committed', committed_at: new Date().toISOString() })
      .eq('id', batchId);

    return NextResponse.json({
      success: true,
      processed,
      skipped: (batchRows || []).length - validRows.length,
    });
  } catch (error) {
    appLogger.error('admin.inventory_import.commit_failed', {
      userId: auth.user.id,
      batchId,
      processed,
      error: error instanceof Error ? error.message : 'unknown_error',
    });

    await db.from('inventory_import_batches').update({ status: 'failed' }).eq('id', batchId);

    return NextResponse.json(
      { error: 'No se pudo guardar la importacion. Revisa el lote y vuelve a intentar.' },
      { status: 400 }
    );
  }
}
