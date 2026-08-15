import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PRODUCTS_PER_REQUEST = 100;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  // Publicar cambia la visibilidad de la tienda: solo administradores.
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Solo un administrador puede publicar productos.' }, { status: 403 });
  }

  const limit = consumeRateLimit({
    bucket: 'admin-products-publish-bulk',
    key: `${auth.user.id}:${ip}`,
    max: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
  }

  let body: { productIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
  }

  if (!Array.isArray(body.productIds)) {
    return NextResponse.json({ error: 'Seleccion de productos invalida.' }, { status: 400 });
  }

  const productIds = [...new Set(body.productIds.filter((value): value is string => typeof value === 'string'))];

  if (productIds.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos un producto archivado.' }, { status: 400 });
  }

  if (productIds.length > MAX_PRODUCTS_PER_REQUEST || productIds.some((id) => !UUID_RE.test(id))) {
    return NextResponse.json({ error: 'Seleccion de productos invalida.' }, { status: 400 });
  }

  const { data, error } = await (auth.supabase as any).rpc('admin_publish_products', {
    p_product_ids: productIds,
  });

  if (error) {
    appLogger.error('admin.products.publish_bulk.failed', {
      requestId,
      adminUserId: auth.user.id,
      role: auth.role,
      count: productIds.length,
      dbError: error.message,
      dbCode: error.code,
    });

    return NextResponse.json(
      { error: 'No se pudieron publicar los productos seleccionados.' },
      { status: 400 }
    );
  }

  const published = Number(data?.published ?? 0);
  const ignored = Number(data?.ignored ?? 0);

  appLogger.info('admin.products.publish_bulk.completed', {
    requestId,
    adminUserId: auth.user.id,
    published,
    ignored,
  });

  return NextResponse.json({ success: true, published, ignored });
}
