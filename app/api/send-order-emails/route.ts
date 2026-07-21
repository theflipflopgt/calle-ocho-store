import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, sendNewOrderNotification } from '@/lib/email';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import { appLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
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

  const auth = await requireAuthenticatedUser();
  const internalApiKey = request.headers.get('x-internal-api-key');
  const isInternalCall =
    Boolean(process.env.INTERNAL_API_KEY) && internalApiKey === process.env.INTERNAL_API_KEY;

  if (!auth.user && !isInternalCall) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      customerEmail,
      customerName,
      orderNumber,
      orderDate,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      shippingAddress,
      customerNotes,
    } = body;

    // Validate required fields
    if (!customerEmail || !customerName || !orderNumber || !items || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send confirmation email to customer
    const customerEmailResult = await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName,
      orderNumber,
      orderDate,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      shippingAddress,
    });

    // Send notification to business
    const businessEmailResult = await sendNewOrderNotification({
      customerName,
      customerEmail,
      orderNumber,
      orderDate,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      shippingAddress,
      customerNotes,
    });

    return NextResponse.json({
      success: true,
      customerEmailSent: customerEmailResult.success,
      businessEmailSent: businessEmailResult.success,
    });
  } catch (error) {
    appLogger.error('send-order-emails.failed', {
      error: error instanceof Error ? error.message : 'unknown_error',
      ip,
    });
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
