import { NextRequest, NextResponse } from 'next/server';
import { getNeoPayReadiness } from '@/lib/payments/neopay/config';
import { verifyConfiguredWebhookSignature } from '@/lib/payments/neopay/webhook';
import { appLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const readiness = getNeoPayReadiness();
  if (!readiness.enabled) {
    return NextResponse.json({ error: 'NeoPay no está habilitado.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-neopay-signature');

  if (!verifyConfiguredWebhookSignature(rawBody, signature)) {
    appLogger.warn('payments.neopay.webhook.invalid_signature');
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 401 });
  }

  // Intencionalmente no cambia pedidos todavía. El nombre del encabezado, la
  // firma, los estados y el identificador único deben ajustarse a la guía
  // técnica oficial de NeoNet y pasar certificación antes de producción.
  appLogger.info('payments.neopay.webhook.received_not_processed');
  return NextResponse.json({ received: true, processed: false }, { status: 202 });
}
