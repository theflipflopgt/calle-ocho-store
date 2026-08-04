import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppCloudReadiness } from '@/lib/whatsapp/config';
import { verifyWhatsAppWebhookSignature } from '@/lib/whatsapp/signature';
import { recordWhatsAppWebhookEvents } from '@/lib/whatsapp/webhook-events';
import { appLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const suppliedToken = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();

  if (mode !== 'subscribe' || !challenge || !verifyToken || suppliedToken !== verifyToken) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  return new NextResponse(challenge, {
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' },
    status: 200,
  });
}

export async function POST(request: NextRequest) {
  const readiness = getWhatsAppCloudReadiness();
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (
    !readiness.enabled ||
    !verifyWhatsAppWebhookSignature(rawBody, signature, readiness.values.appSecret)
  ) {
    appLogger.warn('whatsapp.webhook.rejected');
    return NextResponse.json({ error: 'Webhook no autorizado.' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    if (payload?.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    await recordWhatsAppWebhookEvents(payload);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    appLogger.error('whatsapp.webhook.failed', {
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    return NextResponse.json({ error: 'No se pudo procesar el webhook.' }, { status: 500 });
  }
}

