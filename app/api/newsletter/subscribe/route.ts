import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const limit = consumeRateLimit({
    bucket: 'newsletter-subscribe',
    key: ip,
    max: 5,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { status: 429 }
    );
  }

  let body: { email?: string; source?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud invalida.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email || !emailRegex.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Ingresa un correo valido.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await (supabase as any).from('newsletter_subscribers').insert(
    {
      email,
      source: body.source || 'footer',
      status: 'subscribed',
      subscribed_at: new Date().toISOString(),
    }
  );

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ success: true });
    }

    appLogger.error('newsletter.subscribe.failed', {
      ip,
      error: error.message,
    });

    return NextResponse.json(
      { error: 'No pudimos guardar tu correo. Intenta de nuevo.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
