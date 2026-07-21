import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { mapOrderErrorMessage } from '@/lib/orders/errors';
import { appLogger } from '@/lib/logger';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import type { OrderStatus } from '@/types/order-workflow';

interface StatusRequestBody {
  status?: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
}

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
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const limit = consumeRateLimit({
    bucket: 'admin-order-status',
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

  let body: StatusRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json({ error: 'Debes enviar un estado.' }, { status: 400 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID de orden inválido.' }, { status: 400 });
  }

  if ((body.note || '').length > 500) {
    return NextResponse.json({ error: 'La nota excede el máximo permitido.' }, { status: 400 });
  }

  const db = auth.supabase as any;

  const { data, error } = await db.rpc('admin_update_order_status', {
    p_order_id: id,
    p_new_status: body.status,
    p_tracking_number: body.trackingNumber || null,
    p_tracking_url: body.trackingUrl || null,
    p_note: body.note || null,
  });

  if (error || !data) {
    appLogger.error('admin.orders.status.failed', {
      requestId,
      orderId: id,
      adminUserId: auth.user.id,
      dbError: error?.message,
      dbCode: error?.code,
    });

    return NextResponse.json(
      { error: mapOrderErrorMessage(error?.message) },
      { status: 400 }
    );
  }

  appLogger.info('admin.orders.status.updated', {
    requestId,
    orderId: id,
    adminUserId: auth.user.id,
    status: body.status,
  });

  try {
    const { data: order } = await db
      .from('orders')
      .select(`
        order_number,
        shipping_recipient_name,
        tracking_number,
        tracking_url,
        profiles:user_id(email, full_name)
      `)
      .eq('id', id)
      .single();

    const customerEmail = order?.profiles?.email;
    if (order && customerEmail) {
      await sendOrderStatusUpdateEmail({
        to: customerEmail,
        customerName: order.profiles?.full_name || order.shipping_recipient_name,
        orderNumber: order.order_number,
        status: body.status,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
      });
    }
  } catch (emailError) {
    appLogger.warn('admin.orders.status.email_failed', {
      requestId,
      orderId: id,
      adminUserId: auth.user.id,
      status: body.status,
      error: emailError instanceof Error ? emailError.message : 'unknown_email_error',
    });
  }

  return NextResponse.json({ success: true, status: data });
}
