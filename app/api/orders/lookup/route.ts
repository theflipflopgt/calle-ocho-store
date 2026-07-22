import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumePersistentRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

function normalizeOrderNumber(value: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= 80 ? trimmed : null;
}

function normalizeToken(value: string | null) {
  const trimmed = value?.trim();
  return trimmed && /^[a-f0-9]{64}$/i.test(trimmed) ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIpFromHeaders(request.headers);
  const orderNumber = normalizeOrderNumber(request.nextUrl.searchParams.get('order'));
  const token = normalizeToken(request.nextUrl.searchParams.get('token'));
  const admin = createAdminClient();

  const limit = await consumePersistentRateLimit({
    bucket: 'orders-lookup',
    key: ip,
    max: 30,
    windowMs: 60_000,
    db: admin,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
      { status: 429 }
    );
  }

  if (!orderNumber) {
    return NextResponse.json({ error: 'Número de pedido inválido.' }, { status: 400 });
  }

  const auth = await requireAuthenticatedUser();
  const db = token ? admin : (auth.supabase as any);

  if (!db) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  let query = db
    .from('orders')
    .select(
      `
        id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        total,
        shipping_recipient_name,
        shipping_phone,
        shipping_street_address,
        shipping_zone,
        shipping_neighborhood,
        shipping_city,
        shipping_department,
        tracking_number,
        tracking_url,
        created_at,
        payments (
          payment_method
        ),
        items:order_items(
          id,
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
    .eq('order_number', orderNumber);

  if (token) {
    query = query.eq('guest_access_token', token);
  } else if (auth.user) {
    query = query.eq('user_id', auth.user.id);
  } else {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { data, error } = await query.single();

  if (error || !data) {
    appLogger.warn('orders.lookup.not_found', {
      requestId,
      orderNumber,
      hasToken: Boolean(token),
      userId: auth.user?.id || null,
      error: error?.message,
    });

    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
