import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!auth.canManageOrders) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID de orden inválido.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const paymentLinkUrl = String(body?.paymentLinkUrl || '').trim();
  const markAsSent = body?.markAsSent === true;

  if (!paymentLinkUrl || !isValidHttpsUrl(paymentLinkUrl) || paymentLinkUrl.length > 500) {
    return NextResponse.json({ error: 'Ingresa un link HTTPS válido.' }, { status: 400 });
  }

  const db = createAdminClient() || auth.supabase;
  const now = new Date().toISOString();

  const { error: orderError } = await (db as any)
    .from('orders')
    .update({
      payment_link_url: paymentLinkUrl,
      payment_link_sent_at: markAsSent ? now : null,
      payment_link_sent_by: markAsSent ? auth.user.id : null,
    })
    .eq('id', id);

  if (orderError) {
    return NextResponse.json({ error: 'No se pudo guardar el link de pago.' }, { status: 500 });
  }

  const { data: payment } = await (db as any)
    .from('payments')
    .select('id, payment_details')
    .eq('order_id', id)
    .in('payment_method', ['neo_link_direct', 'neo_link_installments'])
    .maybeSingle();

  if (payment) {
    await (db as any)
      .from('payments')
      .update({
        payment_details: {
          ...(payment.payment_details || {}),
          payment_link_url: paymentLinkUrl,
          payment_link_sent_at: markAsSent ? now : null,
        },
      })
      .eq('id', payment.id);
  }

  return NextResponse.json({ success: true });
}
