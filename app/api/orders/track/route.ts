import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

function normalizeOrderNumber(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 80 ? trimmed : null;
}

function normalizeContact(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length >= 6 && trimmed.length <= 254 ? trimmed : null;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);
  const limit = consumeRateLimit({
    bucket: 'orders-track',
    key: ip,
    max: 12,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429 }
    );
  }

  let body: { orderNumber?: string; contact?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const orderNumber = normalizeOrderNumber(body.orderNumber);
  const contact = normalizeContact(body.contact);

  if (!orderNumber || !contact) {
    return NextResponse.json(
      { error: 'Ingresa el número de pedido y el correo o teléfono usado en la compra.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'El seguimiento requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    );
  }

  const { data: order, error } = await (admin as any)
    .from('orders')
    .select(
      `
        id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        total,
        guest_email,
        guest_phone,
        shipping_recipient_name,
        shipping_phone,
        shipping_city,
        shipping_department,
        tracking_number,
        tracking_url,
        created_at,
        profiles:user_id (email),
        items:order_items(
          id,
          product_name,
          brand_name,
          color_name,
          size_us,
          quantity,
          subtotal
        )
      `
    )
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    appLogger.warn('orders.track.not_found', {
      requestId,
      orderNumber,
      error: error?.message,
    });
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  const profileEmail = Array.isArray(order.profiles)
    ? order.profiles[0]?.email
    : order.profiles?.email;
  const contactDigits = digitsOnly(contact);
  const emailMatches =
    contact.includes('@') &&
    [order.guest_email, profileEmail].some((email) => email?.toLowerCase() === contact);
  const phoneMatches =
    contactDigits.length >= 8 &&
    [order.guest_phone, order.shipping_phone].some(
      (phone) => digitsOnly(phone || '').endsWith(contactDigits) || contactDigits.endsWith(digitsOnly(phone || ''))
    );

  if (!emailMatches && !phoneMatches) {
    return NextResponse.json({ error: 'Los datos no coinciden con el pedido.' }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      total: order.total,
      shipping_recipient_name: order.shipping_recipient_name,
      shipping_city: order.shipping_city,
      shipping_department: order.shipping_department,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      created_at: order.created_at,
      items: order.items || [],
    },
  });
}
