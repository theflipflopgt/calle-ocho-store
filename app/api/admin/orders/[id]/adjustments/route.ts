import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

interface AdjustmentsRequestBody {
  discountPercent?: number;
  freeShipping?: boolean;
}

const allowedDiscounts = new Set([0, 10, 20]);
const adjustableStatuses = new Set(['pending']);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatAdjustmentNote({
  discountPercent,
  freeShipping,
  discountAmount,
  shippingCost,
  total,
}: {
  discountPercent: number;
  freeShipping: boolean;
  discountAmount: number;
  shippingCost: number;
  total: number;
}) {
  const parts = [
    `descuento ${discountPercent}%`,
    freeShipping ? 'envio gratis' : `envio Q${shippingCost.toFixed(2)}`,
    `total Q${total.toFixed(2)}`,
  ];

  return `Ajuste administrativo: ${parts.join(', ')}. Descuento aplicado Q${discountAmount.toFixed(2)}.`;
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

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    );
  }

  const { data: order, error: orderError } = await (db as any)
    .from('orders')
    .select('id,status,subtotal,shipping_cost,total,admin_notes')
    .eq('id', id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  if (!adjustableStatuses.has(order.status)) {
    return NextResponse.json(
      { error: 'Solo se pueden ajustar pedidos pendientes de pago.' },
      { status: 400 }
    );
  }

  const subtotal = Number(order.subtotal || 0);
  const currentShippingCost = Number(order.shipping_cost || 0);
  const nextShippingCost = freeShipping ? 0 : currentShippingCost;
  const discountAmount = roundMoney(subtotal * (discountPercent / 100));
  const total = Math.max(roundMoney(subtotal + nextShippingCost - discountAmount), 0);
  const note = formatAdjustmentNote({
    discountPercent,
    freeShipping,
    discountAmount,
    shippingCost: nextShippingCost,
    total,
  });
  const adminNotes = [order.admin_notes, note].filter(Boolean).join('\n');

  const { data: updatedOrder, error: updateError } = await (db as any)
    .from('orders')
    .update({
      discount_amount: discountAmount,
      coupon_id: null,
      coupon_code: discountPercent > 0 ? `ADMIN${discountPercent}` : null,
      coupon_discount: discountPercent > 0 ? discountPercent : null,
      shipping_cost: nextShippingCost,
      total,
      admin_notes: adminNotes,
      admin_notes_updated_at: new Date().toISOString(),
      admin_notes_updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id,discount_amount,shipping_cost,total,coupon_code,admin_notes')
    .single();

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

  const { error: paymentError } = await (db as any)
    .from('payments')
    .update({
      amount: total,
      payment_details: {
        adjusted_by: auth.user.id,
        discount_percent: discountPercent,
        free_shipping: freeShipping,
        adjusted_total: total,
      },
    })
    .eq('order_id', id)
    .eq('status', 'pending');

  if (paymentError) {
    appLogger.warn('admin.orders.adjustments.payment_update_failed', {
      requestId,
      orderId: id,
      adminUserId: auth.user.id,
      dbError: paymentError.message,
      dbCode: paymentError.code,
    });
  }

  appLogger.info('admin.orders.adjustments.updated', {
    requestId,
    orderId: id,
    adminUserId: auth.user.id,
    discountPercent,
    freeShipping,
    total,
  });

  return NextResponse.json({
    success: true,
    order: updatedOrder,
  });
}
