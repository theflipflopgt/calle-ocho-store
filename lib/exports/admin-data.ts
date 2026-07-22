import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { formatPrice } from '@/lib/utils/currency';

export async function requireAdminExport() {
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return { error: Response.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  if (!auth.isAdmin) {
    return { error: Response.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }

  return { db: auth.supabase as any };
}

export async function getProductExportRows(db: any) {
  const { data, error } = await db
    .from('products')
    .select(`
      id,
      name,
      sku,
      slug,
      base_price,
      compare_at_price,
      status,
      gender,
      created_at,
      brands:brand_id (name),
      categories:category_id (name),
      product_colors (
        color_name,
        product_color_images (
          image_url,
          display_order
        ),
        product_variants (
          sku,
          size_us,
          stock_quantity,
          is_available,
          price_override
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows: any[] = [];

  for (const product of data || []) {
    const colors = product.product_colors || [];

    if (colors.length === 0) {
      rows.push({ product, color: null, variant: null });
      continue;
    }

    for (const color of colors) {
      const variants = color.product_variants || [];
      if (variants.length === 0) {
        rows.push({ product, color, variant: null });
        continue;
      }

      for (const variant of variants) {
        rows.push({ product, color, variant });
      }
    }
  }

  return rows;
}

export function productRowsToXlsx(rows: any[]) {
  return [
    [
      'Producto',
      'Marca',
      'Categoría',
      'Género',
      'SKU producto',
      'Color',
      'SKU variante',
      'Talla US',
      'Stock',
      'Disponible',
      'Precio base',
      'Precio especial',
      'Precio anterior',
      'Estado',
      'URL',
    ],
    ...rows.map(({ product, color, variant }) => [
      product.name,
      product.brands?.name || '',
      product.categories?.name || '',
      product.gender || '',
      product.sku || '',
      color?.color_name || '',
      variant?.sku || '',
      variant?.size_us || '',
      variant?.stock_quantity ?? '',
      variant ? (variant.is_available ? 'Sí' : 'No') : '',
      Number(product.base_price || 0),
      variant?.price_override ? Number(variant.price_override) : '',
      product.compare_at_price ? Number(product.compare_at_price) : '',
      product.status || '',
      `/producto/${product.slug}`,
    ]),
  ];
}

export async function getSalesExportRows(db: any, url: URL) {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const status = url.searchParams.get('status');

  let query = db
    .from('orders')
    .select(`
      order_number,
      status,
      subtotal,
      shipping_cost,
      discount_amount,
      total,
      shipping_recipient_name,
      shipping_phone,
      shipping_city,
      shipping_department,
      guest_email,
      created_at,
      profiles:user_id (email),
      order_items (
        product_name,
        brand_name,
        color_name,
        size_us,
        quantity,
        unit_price,
        subtotal
      )
    `)
    .order('created_at', { ascending: false });

  if (from) query = query.gte('created_at', `${from}T00:00:00`);
  if (to) query = query.lte('created_at', `${to}T23:59:59`);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  const rows: any[] = [];

  for (const order of data || []) {
    const items = order.order_items || [];
    if (items.length === 0) {
      rows.push({ order, item: null });
      continue;
    }
    for (const item of items) {
      rows.push({ order, item });
    }
  }

  return rows;
}

export function salesRowsToXlsx(rows: any[]) {
  return [
    [
      'Pedido',
      'Fecha',
      'Estado',
      'Cliente',
      'Correo',
      'Teléfono',
      'Ciudad',
      'Departamento',
      'Producto',
      'Marca',
      'Color',
      'Talla US',
      'Cantidad',
      'Precio unitario',
      'Subtotal línea',
      'Subtotal pedido',
      'Descuento',
      'Envío',
      'Total pedido',
    ],
    ...rows.map(({ order, item }) => [
      order.order_number,
      order.created_at ? new Date(order.created_at).toLocaleString('es-GT') : '',
      order.status,
      order.shipping_recipient_name || '',
      (Array.isArray(order.profiles) ? order.profiles[0]?.email : order.profiles?.email) || order.guest_email || '',
      order.shipping_phone || '',
      order.shipping_city || '',
      order.shipping_department || '',
      item?.product_name || '',
      item?.brand_name || '',
      item?.color_name || '',
      item?.size_us || '',
      item?.quantity || '',
      item ? Number(item.unit_price || 0) : '',
      item ? Number(item.subtotal || 0) : '',
      Number(order.subtotal || 0),
      Number(order.discount_amount || 0),
      Number(order.shipping_cost || 0),
      Number(order.total || 0),
    ]),
  ];
}

function normalizeCatalogGender(gender?: string | null) {
  if (gender === 'women') return 'mujer';
  if (gender === 'men') return 'hombre';
  if (gender === 'kids') return 'ninos';
  return gender || 'unisex';
}

export function rowsToCatalogProducts(rows: any[]) {
  const map = new Map<string, any>();

  for (const { product, color, variant } of rows) {
    if (!map.has(product.id)) {
      map.set(product.id, {
        name: product.name,
        brand: product.brands?.name || 'Sin marca',
        gender: normalizeCatalogGender(product.gender),
        isOffer: Number(product.compare_at_price || 0) > Number(product.base_price || 0),
        sku: product.sku || '',
        price: formatPrice(Number(product.base_price || 0)),
        previousPrice:
          Number(product.compare_at_price || 0) > Number(product.base_price || 0)
            ? formatPrice(Number(product.compare_at_price || 0))
            : null,
        status: product.status || '',
        imageUrl:
          color?.product_color_images
            ?.slice()
            .sort((a: any, b: any) => Number(a.display_order || 0) - Number(b.display_order || 0))
            ?.[0]?.image_url || null,
        variants: [] as string[],
      });
    }

    if (variant?.is_available && Number(variant.stock_quantity || 0) > 0) {
      map
        .get(product.id)
        .variants.push(`Talla US ${variant.size_us} - ${color?.color_name || 'Color'} - ${variant.stock_quantity} disp.`);
    }
  }

  return Array.from(map.values()).filter((product) => product.variants.length > 0);
}
