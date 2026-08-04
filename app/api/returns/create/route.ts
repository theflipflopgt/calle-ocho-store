import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { consumePersistentRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';

const requestTypes = new Set(['size_exchange', 'return', 'damaged_item', 'wrong_item']);

function digits(value: string) {
  return value.replace(/\D/g, '');
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503 });

  const ip = getClientIpFromHeaders(request.headers);
  const limit = await consumePersistentRateLimit({
    bucket: 'return-request', key: ip, max: 6, windowMs: 60_000, db: admin, failClosed: true,
  });
  if (!limit.allowed) return NextResponse.json({ error: 'Demasiados intentos.' }, { status: 429 });

  const body = await request.json().catch(() => null);
  const orderNumber = String(body?.orderNumber || '').trim();
  const contact = String(body?.contact || '').trim().toLowerCase();
  const requestType = String(body?.requestType || '');
  const reason = String(body?.reason || '').trim();
  if (!orderNumber || contact.length < 6 || !requestTypes.has(requestType) || reason.length < 10 || reason.length > 1000) {
    return NextResponse.json({ error: 'Completa correctamente todos los campos.' }, { status: 400 });
  }

  const auth = await requireAuthenticatedUser();
  const { data: order } = await (admin as any)
    .from('orders')
    .select('id,user_id,guest_email,guest_phone,shipping_phone,profiles:user_id(email,phone)')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
  const emailMatches = [order.guest_email, profile?.email].filter(Boolean).some((value) => String(value).toLowerCase() === contact);
  const contactDigits = digits(contact);
  const phoneMatches = [order.guest_phone, order.shipping_phone, profile?.phone]
    .filter(Boolean)
    .some((value) => digits(String(value)) === contactDigits);
  const ownsAuthenticatedOrder = Boolean(auth.user && order.user_id === auth.user.id);

  if (!ownsAuthenticatedOrder && !emailMatches && !phoneMatches) {
    return NextResponse.json({ error: 'Los datos no coinciden con el pedido.' }, { status: 404 });
  }

  const { data: existing } = await (admin as any)
    .from('return_requests')
    .select('id')
    .eq('order_id', order.id)
    .not('status', 'in', '(rejected,completed,cancelled)')
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'Este pedido ya tiene una solicitud abierta.' }, { status: 409 });
  }

  const { data, error } = await (admin as any)
    .from('return_requests')
    .insert({
      order_id: order.id,
      user_id: auth.user?.id || null,
      guest_email: auth.user ? null : (emailMatches ? contact : order.guest_email),
      request_type: requestType,
      reason,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'No se pudo crear la solicitud.' }, { status: 400 });
  return NextResponse.json({ success: true, requestId: data.id });
}
