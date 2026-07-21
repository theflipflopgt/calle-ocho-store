import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { validateOrderCreateInput } from '@/lib/orders/validation';
import { mapOrderErrorMessage } from '@/lib/orders/errors';
import { appLogger } from '@/lib/logger';
import type { OrderCreateInput, OrderCreateResult } from '@/types/order-workflow';
import { sendNewOrderNotification, sendOrderConfirmationEmail } from '@/lib/email';

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Demasiados intentos. Intenta nuevamente en unos segundos.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);

  const auth = await requireAuthenticatedUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const limit = consumeRateLimit({
    bucket: 'orders-create',
    key: `${auth.user.id}:${ip}`,
    max: 6,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    appLogger.warn('orders.create.rate_limited', {
      requestId,
      userId: auth.user.id,
      ip,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  let body: Partial<OrderCreateInput>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const validation = validateOrderCreateInput(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const payload = body as OrderCreateInput;

  if (payload.paymentMethod !== 'bank_transfer') {
    return NextResponse.json(
      { error: 'NeoPay todavía no está habilitado. Selecciona transferencia bancaria mientras se completa la certificación.' },
      { status: 503 }
    );
  }

  const db = auth.supabase as any;

  const { data, error } = await db.rpc('create_checkout_order', {
    p_shipping: payload.shipping,
    p_customer_notes: payload.customerNotes || null,
    p_coupon_code: payload.couponCode?.trim() || null,
    p_payment_method: payload.paymentMethod,
  });

  if (error || !data) {
    appLogger.error('orders.create.failed', {
      requestId,
      userId: auth.user.id,
      ip,
      dbError: error?.message,
      dbCode: error?.code,
    });

    return NextResponse.json(
      { error: mapOrderErrorMessage(error?.message) },
      { status: 400 }
    );
  }

  const orderResult = data as OrderCreateResult;

  // Best-effort email notifications; order success is not blocked by email failures.
  try {
    const { data: order } = await db
      .from('orders')
      .select(
        `
          order_number,
          subtotal,
          shipping_cost,
          discount_amount,
          total,
          shipping_recipient_name,
          shipping_phone,
          shipping_street_address,
          shipping_zone,
          shipping_neighborhood,
          shipping_city,
          shipping_department,
          customer_notes,
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
      )
      .eq('id', orderResult.orderId)
      .single();

    if (order && auth.user.email) {
      const orderDate = new Date().toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const emailPayload = {
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
        customerNotes: order.customer_notes,
      };

      await Promise.all([
        sendOrderConfirmationEmail({
          to: auth.user.email,
          customerName: emailPayload.customerName,
          orderNumber: emailPayload.orderNumber,
          orderDate: emailPayload.orderDate,
          items: emailPayload.items,
          subtotal: emailPayload.subtotal,
          shippingCost: emailPayload.shippingCost,
          discount: emailPayload.discount,
          total: emailPayload.total,
          shippingAddress: emailPayload.shippingAddress,
        }),
        sendNewOrderNotification({
          customerName: emailPayload.customerName,
          customerEmail: auth.user.email,
          orderNumber: emailPayload.orderNumber,
          orderDate: emailPayload.orderDate,
          items: emailPayload.items,
          subtotal: emailPayload.subtotal,
          shippingCost: emailPayload.shippingCost,
          discount: emailPayload.discount,
          total: emailPayload.total,
          shippingAddress: emailPayload.shippingAddress,
          customerNotes: emailPayload.customerNotes,
        }),
      ]);
    }
  } catch (emailError) {
    appLogger.warn('orders.create.email_failed', {
      requestId,
      userId: auth.user.id,
      orderId: orderResult.orderId,
      error: emailError instanceof Error ? emailError.message : 'unknown_email_error',
    });
  }

  appLogger.info('orders.create.success', {
    requestId,
    userId: auth.user.id,
    orderId: orderResult.orderId,
    orderNumber: orderResult.orderNumber,
    total: orderResult.total,
  });

  return NextResponse.json({
    success: true,
    order: orderResult,
  });
}
