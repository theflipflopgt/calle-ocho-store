import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumePersistentRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { isValidIdempotencyKey, validateGuestOrderCreateInput, validateOrderCreateInput } from '@/lib/orders/validation';
import { mapOrderErrorMessage } from '@/lib/orders/errors';
import { appLogger } from '@/lib/logger';
import type { OrderCreateInput, OrderCreateResult } from '@/types/order-workflow';
import { sendNewOrderNotification, sendOrderConfirmationEmail } from '@/lib/email';
import { getDeliveryCoverage } from '@/lib/shipping';

const CASH_ON_DELIVERY_ENABLED = process.env.CASH_ON_DELIVERY_ENABLED === 'true';

function deliveryFor(input: OrderCreateInput) {
  return getDeliveryCoverage(
    input.shipping.department,
    input.shipping.city,
    0,
    CASH_ON_DELIVERY_ENABLED
  );
}

function supportsOwnDelivery(input: OrderCreateInput) {
  return deliveryFor(input).isOwnDelivery;
}

function supportsCashOnDelivery(input: OrderCreateInput) {
  return deliveryFor(input).cashOnDeliveryAllowed;
}

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

function getOrderDate(value?: string | null) {
  return new Date(value || Date.now()).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function sendOrderEmails({
  db,
  orderId,
  customerEmail,
  requestId,
  userId,
}: {
  db: any;
  orderId: string;
  customerEmail: string;
  requestId: string;
  userId?: string | null;
}) {
  try {
    const { data: order } = await db
      .from('orders')
      .select(
        `
          order_number,
          created_at,
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
      .eq('id', orderId)
      .single();

    if (!order) {
      return;
    }

    const emailPayload = {
      customerName: order.shipping_recipient_name,
      orderNumber: order.order_number,
      orderDate: getOrderDate(order.created_at),
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

    const [customerResult, businessResult] = await Promise.all([
      sendOrderConfirmationEmail({
        to: customerEmail,
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
        customerEmail,
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

    if (!customerResult.success || !businessResult.success) {
      appLogger.warn('orders.create.email_failed', {
        requestId,
        userId,
        orderId,
        customerEmailSent: customerResult.success,
        businessEmailSent: businessResult.success,
      });
    }
  } catch (emailError) {
    appLogger.warn('orders.create.email_failed', {
      requestId,
      userId,
      orderId,
      error: emailError instanceof Error ? emailError.message : 'unknown_email_error',
    });
  }
}

async function updateManualPaymentMethod({
  db,
  orderId,
  paymentMethod,
  isOwnDelivery,
}: {
  db: any;
  orderId: string;
  paymentMethod: OrderCreateInput['paymentMethod'];
  isOwnDelivery: boolean;
}) {
  const writeDb = createAdminClient() || db;
  const isCashOnDelivery = paymentMethod === 'cash_on_delivery';

  const { error } = await writeDb
    .from('payments')
    .update({
      payment_method: isCashOnDelivery ? 'cash_on_delivery' : 'bank_transfer',
      payment_details: {
        mode: 'manual',
        selected_method: isCashOnDelivery ? 'cash_on_delivery' : 'bank_transfer',
        contact_channel: 'whatsapp',
        requires_manual_confirmation: !isCashOnDelivery,
        delivery_method: isOwnDelivery ? 'own_delivery' : 'guatex_collect',
        shipping_fee_collection: isOwnDelivery ? 'included_in_order' : 'paid_to_carrier_on_delivery',
      },
    })
    .eq('order_id', orderId)
    .in('payment_method', ['cash_on_delivery', 'bank_transfer'])
    .eq('status', 'pending');

  if (error) {
    appLogger.warn('orders.create.payment_method_lookup_failed', {
      paymentMethod,
      error: error.message,
    });
  }

  return data;
}

async function getActivePaymentMethod(db: any, paymentMethod: string) {
  const { data, error } = await db
    .from('payment_methods')
    .select('code:id, provider, is_enabled')
    .eq('id', paymentMethod)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error) {
    appLogger.warn('orders.create.payment_method_lookup_failed', {
      paymentMethod,
      error: error.message,
    });
  }

  return data;
}

async function assignOrderToSeller(db: any, orderId: string, requestId: string) {
  const writeDb = createAdminClient() || db;
  const { data, error } = await writeDb.rpc('assign_order_to_next_seller', {
    p_order_id: orderId,
  });

  if (error) {
    appLogger.warn('orders.create.seller_assignment_failed', {
      requestId,
      orderId,
      error: error.message,
    });
  }

  return data as string | null;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);
  const auth = await requireAuthenticatedUser();
  const rateLimitKey = auth.user ? `${auth.user.id}:${ip}` : `guest:${ip}`;

  const admin = createAdminClient();
  const limit = await consumePersistentRateLimit({
    bucket: 'orders-create',
    key: rateLimitKey,
    max: auth.user ? 6 : 4,
    windowMs: 60_000,
    db: admin,
    failClosed: true,
  });

  if (!limit.allowed) {
    appLogger.warn('orders.create.rate_limited', {
      requestId,
      userId: auth.user?.id || null,
      ip,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  let body: Partial<OrderCreateInput>;

  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return NextResponse.json(
      { error: 'Falta una llave idempotente válida para confirmar el pedido.' },
      { status: 400 }
    );
  }

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const validation = auth.user
    ? validateOrderCreateInput(body)
    : validateGuestOrderCreateInput(body);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const payload = body as OrderCreateInput;

  if (payload.paymentMethod === 'cash_on_delivery' && !supportsCashOnDelivery(payload)) {
    return NextResponse.json(
      { error: 'El pago contra entrega solo está disponible cuando está habilitado y aplica mensajería propia en Ciudad de Guatemala, Mixco o Villa Nueva.' },
      { status: 400 }
    );
  }

  const db = auth.user ? (auth.supabase as any) : createAdminClient();

  if (!db) {
    appLogger.error('orders.create.missing_admin_client', { requestId, ip });
    return NextResponse.json(
      { error: 'El checkout invitado requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    );
  }

  const activePaymentMethod = await getActivePaymentMethod(db, payload.paymentMethod);

  if (!activePaymentMethod) {
    return NextResponse.json(
      { error: 'El método de pago seleccionado no está disponible en este momento.' },
      { status: 400 }
    );
  }

  if (activePaymentMethod.provider === 'neopay') {
    return NextResponse.json(
      { error: 'NeoPay directo todavía no está habilitado. Usa Neo Link para tarjeta de contado o cuotas.' },
      { status: 503 }
    );
  }

  const activePaymentMethod = await getActivePaymentMethod(db, payload.paymentMethod);

  if (!activePaymentMethod) {
    return NextResponse.json(
      { error: 'El método de pago seleccionado no está disponible en este momento.' },
      { status: 400 }
    );
  }

  if (activePaymentMethod.provider === 'neopay') {
    return NextResponse.json(
      { error: 'NeoPay directo todavía no está habilitado. Usa Neo Link para tarjeta de contado o cuotas.' },
      { status: 503 }
    );
  }

  const rpcName = auth.user ? 'create_manual_order_v2' : 'create_guest_manual_order_v2';
  const rpcParams = auth.user
    ? {
        p_shipping: payload.shipping,
        p_customer_notes: payload.customerNotes || null,
        p_coupon_code: payload.couponCode?.trim() || null,
        p_payment_method: payload.paymentMethod,
        p_idempotency_key: idempotencyKey,
        p_is_own_delivery: supportsOwnDelivery(payload),
      }
    : {
        p_customer_email: payload.customerEmail?.trim().toLowerCase(),
        p_shipping: payload.shipping,
        p_items: payload.items,
        p_customer_notes: payload.customerNotes || null,
        p_coupon_code: payload.couponCode?.trim() || null,
        p_payment_method: payload.paymentMethod,
        p_idempotency_key: idempotencyKey,
        p_is_own_delivery: supportsOwnDelivery(payload),
      };

  const { data, error } = await db.rpc(rpcName, rpcParams);

  if (error || !data) {
    appLogger.error('orders.create.failed', {
      requestId,
      userId: auth.user?.id || null,
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
  const customerEmail = auth.user?.email || payload.customerEmail?.trim().toLowerCase();

  await updateManualPaymentMethod({
    db,
    orderId: orderResult.orderId,
    paymentMethod: payload.paymentMethod,
    isOwnDelivery: supportsOwnDelivery(payload),
  });

  if (customerEmail) {
    await sendOrderEmails({
      db,
      orderId: orderResult.orderId,
      customerEmail,
      requestId,
      userId: auth.user?.id || null,
    });
  }

  appLogger.info('orders.create.success', {
    requestId,
    userId: auth.user?.id || null,
    orderId: orderResult.orderId,
    orderNumber: orderResult.orderNumber,
    total: orderResult.total,
  });

  return NextResponse.json({
    success: true,
    order: orderResult,
  });
}
