import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, sendNewOrderNotification } from '@/lib/email';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { appLogger } from '@/lib/logger';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeOrderNumber(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 80 ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);
  const limit = consumeRateLimit({
    bucket: 'send-order-emails',
    key: ip,
    max: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const internalApiKey = request.headers.get('x-internal-api-key');
  const isInternalCall =
    Boolean(process.env.INTERNAL_API_KEY) && internalApiKey === process.env.INTERNAL_API_KEY;
  const auth = await requireAuthenticatedUser();

  if (!auth.user && !isInternalCall) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (auth.user && !auth.isAdmin && !isInternalCall) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const orderId = typeof body.orderId === 'string' && isUuid(body.orderId) ? body.orderId : null;
    const orderNumber = normalizeOrderNumber(body.orderNumber);

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Debes enviar orderId u orderNumber válido.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const db = isInternalCall ? admin : (auth.supabase as any);

    if (!db) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada para llamadas internas.' },
        { status: 500 }
      );
    }

    let query = db
      .from('orders')
      .select(
        `
          id,
          order_number,
          subtotal,
          shipping_cost,
          discount_amount,
          total,
          guest_email,
          created_at,
          shipping_recipient_name,
          shipping_phone,
          shipping_street_address,
          shipping_zone,
          shipping_neighborhood,
          shipping_city,
          shipping_department,
          customer_notes,
          profiles:user_id (email),
          items:order_items(
            product_name,
            brand_name,
            color_name,
            size_us,
            quantity,
            unit_price,
            subtotal,
            product_image_url
          )
        `
      );

    query = orderId ? query.eq('id', orderId) : query.eq('order_number', orderNumber);

    const { data: order, error: orderError } = await query.single();

    if (orderError || !order) {
      appLogger.warn('send-order-emails.order_not_found', {
        requestId,
        orderId,
        orderNumber,
        error: orderError?.message,
      });

      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 });
    }

    const profileEmail = Array.isArray(order.profiles)
      ? order.profiles[0]?.email
      : order.profiles?.email;
    const customerEmail = profileEmail || order.guest_email;

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'La orden no tiene correo de cliente asociado.' },
        { status: 400 }
      );
    }

    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const customerEmailResult = await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName: order.shipping_recipient_name,
      orderNumber: order.order_number,
      orderDate,
      items: order.items || [],
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discount: Number(order.discount_amount || 0),
      total: Number(order.total),
      shippingAddress: {
        recipient_name: order.shipping_recipient_name,
        phone: order.shipping_phone,
        street_address: order.shipping_street_address,
        zone: order.shipping_zone,
        neighborhood: order.shipping_neighborhood,
        city: order.shipping_city,
        department: order.shipping_department,
      },
    });

    const businessEmailResult = await sendNewOrderNotification({
      customerName: order.shipping_recipient_name,
      customerEmail,
      orderNumber: order.order_number,
      orderDate,
      items: order.items || [],
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discount: Number(order.discount_amount || 0),
      total: Number(order.total),
      shippingAddress: {
        recipient_name: order.shipping_recipient_name,
        phone: order.shipping_phone,
        street_address: order.shipping_street_address,
        zone: order.shipping_zone,
        neighborhood: order.shipping_neighborhood,
        city: order.shipping_city,
        department: order.shipping_department,
      },
      customerNotes: order.customer_notes,
    });

    appLogger.info('send-order-emails.completed', {
      requestId,
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmailSent: customerEmailResult.success,
      businessEmailSent: businessEmailResult.success,
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      customerEmailSent: customerEmailResult.success,
      businessEmailSent: businessEmailResult.success,
    });
  } catch (error) {
    appLogger.error('send-order-emails.failed', {
      requestId,
      error: error instanceof Error ? error.message : 'unknown_error',
      ip,
    });
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
