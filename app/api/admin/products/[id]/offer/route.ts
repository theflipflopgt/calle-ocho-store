import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

interface OfferRequestBody {
  enabled?: boolean;
  basePrice?: number | string;
  compareAtPrice?: number | string | null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parsePrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageProducts) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const limit = consumeRateLimit({
    bucket: 'admin-product-offer',
    key: `${auth.user.id}:${ip}`,
    max: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429 }
    );
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID de producto inválido.' }, { status: 400 });
  }

  let body: OfferRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const enabled = body.enabled !== false;
  const update: Record<string, number | string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (enabled) {
    const basePrice = parsePrice(body.basePrice);
    const compareAtPrice = parsePrice(body.compareAtPrice);

    if (!basePrice || basePrice <= 0) {
      return NextResponse.json({ error: 'El nuevo precio debe ser mayor a cero.' }, { status: 400 });
    }

    if (!compareAtPrice || compareAtPrice <= 0) {
      return NextResponse.json(
        { error: 'El precio anterior debe ser mayor a cero.' },
        { status: 400 }
      );
    }

    if (compareAtPrice <= basePrice) {
      return NextResponse.json(
        { error: 'El precio anterior debe ser mayor que el nuevo precio.' },
        { status: 400 }
      );
    }

    update.base_price = basePrice;
    update.compare_at_price = compareAtPrice;
  } else {
    update.compare_at_price = null;
  }

  const db = auth.supabase as any;
  const { data, error } = await db
    .from('products')
    .update(update)
    .eq('id', id)
    .select('id, name, base_price, compare_at_price')
    .single();

  if (error || !data) {
    appLogger.error('admin.products.offer.failed', {
      requestId,
      productId: id,
      adminUserId: auth.user.id,
      role: auth.role,
      dbError: error?.message,
      dbCode: error?.code,
    });

    return NextResponse.json(
      { error: 'No se pudo actualizar la oferta del producto.' },
      { status: 400 }
    );
  }

  appLogger.info('admin.products.offer.updated', {
    requestId,
    productId: id,
    adminUserId: auth.user.id,
    role: auth.role,
    enabled,
  });

  return NextResponse.json({ success: true, product: data });
}
