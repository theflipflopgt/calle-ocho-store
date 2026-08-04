import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

interface AdjustmentsRequestBody {
  discountPercent?: number;
  freeShipping?: boolean;
}

const allowedDiscounts = new Set([0, 10, 20]);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: 'Solo un administrador puede aplicar descuentos o modificar el envío.' },
      { status: 403 }
    );
  }

  const limit = consumeRateLimit({
    bucket: 'admin-order-adjustments',
    key: `${auth.user.id}:${ip}`,
    max: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429 }
    );
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID de orden inválido.' }, { status: 400 });
  }

  let body: AdjustmentsRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const discountPercent = Number(body.discountPercent ?? 0);
  const freeShipping = Boolean(body.freeShipping);

  if (!allowedDiscounts.has(discountPercent)) {
    return NextResponse.json({ error: 'El descuento debe ser 0%, 10% o 20%.' }, { status: 400 });
  }

  const { data: updatedOrder, error: updateError } = await (auth.supabase as any).rpc(
    'admin_adjust_order',
    {
      p_order_id: id,
      p_discount_percent: discountPercent,
      p_free_shipping: freeShipping,
    }
  );

  if (updateError || !updatedOrder) {
    appLogger.error('admin.orders.adjustments.failed', {
      requestId,
      orderId: id,
      adminUserId: auth.user.id,
      dbError: updateError?.message,
      dbCode: updateError?.code,
    });

    return NextResponse.json({ error: 'No se pudo ajustar el pedido.' }, { status: 400 });
  }

  appLogger.info('admin.orders.adjustments.updated', {
    requestId,
    orderId: id,
    adminUserId: auth.user.id,
    discountPercent,
    freeShipping,
    total: updatedOrder.total,
  });

  return NextResponse.json({
    success: true,
    order: updatedOrder,
  });
}
