import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

const statuses = new Set(['pending', 'ready', 'shipped', 'in_transit', 'delivered', 'exception', 'returned', 'cancelled']);

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.canAccessAdmin) return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || '');
  const carrier = String(body?.carrier || '').trim();
  const status = String(body?.status || 'pending');
  const shippingCost = body?.shippingCost === null || body?.shippingCost === ''
    ? null
    : Number(body?.shippingCost);

  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !carrier || !statuses.has(status)) {
    return NextResponse.json({ error: 'Datos de envío inválidos.' }, { status: 400 });
  }
  if (shippingCost !== null && (!Number.isFinite(shippingCost) || shippingCost < 0)) {
    return NextResponse.json({ error: 'Costo de envío inválido.' }, { status: 400 });
  }

  const { data, error } = await (auth.supabase as any).rpc('admin_upsert_shipment', {
    p_shipment_id: body?.shipmentId || null,
    p_order_id: orderId,
    p_carrier: carrier,
    p_service: String(body?.service || '') || null,
    p_status: status,
    p_tracking_number: String(body?.trackingNumber || '') || null,
    p_tracking_url: String(body?.trackingUrl || '') || null,
    p_shipping_cost: shippingCost,
  });

  if (error) return NextResponse.json({ error: 'No se pudo guardar el envío.' }, { status: 400 });

  if (status === 'shipped') {
    const { data: order } = await (auth.supabase as any)
      .from('orders')
      .select('order_number,guest_email,shipping_recipient_name,tracking_number,tracking_url,profiles:user_id(email)')
      .eq('id', orderId)
      .maybeSingle();
    const profile = Array.isArray(order?.profiles) ? order.profiles[0] : order?.profiles;
    const recipient = profile?.email || order?.guest_email;
    if (recipient) {
      await sendOrderStatusUpdateEmail({
        to: recipient,
        customerName: order.shipping_recipient_name || 'Cliente',
        orderNumber: order.order_number,
        status: 'shipped',
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
      });
    }
  }
  return NextResponse.json({ success: true, shipmentId: data });
}
