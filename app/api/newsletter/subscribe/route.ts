import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNewsletterAdminNotification, sendNewsletterWelcomeEmail } from '@/lib/email';
import { consumeRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';
import { appLogger } from '@/lib/logger';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedSources = new Set(['footer', 'checkout', 'popup', 'account']);

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
  const source = allowedSources.has(body.source || '') ? body.source! : 'footer';

  if (!email || !emailRegex.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Ingresa un correo valido.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  let shouldSendWelcomeEmail = true;
  let error: { code?: string; message?: string } | null = null;

  if (admin) {
    const newsletterDb = admin as any;
    const { data: existing, error: lookupError } = await newsletterDb
      .from('newsletter_subscribers')
      .select('status')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) {
      appLogger.warn('newsletter.subscribe.lookup_failed', {
        ip,
        error: lookupError.message,
      });
    }

    shouldSendWelcomeEmail = existing?.status !== 'subscribed';

    const result = await newsletterDb.from('newsletter_subscribers').upsert(
      {
        email,
        source,
        status: 'subscribed',
        subscribed_at: now,
        unsubscribed_at: null,
        updated_at: now,
      },
      { onConflict: 'email' }
    );

    error = result.error;
  } else {
    const supabase = await createClient();
    const result = await (supabase as any).from('newsletter_subscribers').insert(
      {
        email,
        source,
        status: 'subscribed',
        subscribed_at: now,
      }
    );

    error = result.error;

    if (error?.code === '23505') {
      shouldSendWelcomeEmail = false;
      error = null;
    }
  }

  if (error) {
    appLogger.error('newsletter.subscribe.failed', {
      ip,
      error: error.message,
    });

    return NextResponse.json(
      { error: 'No pudimos guardar tu correo. Intenta de nuevo.' },
      { status: 500 }
    );
  }

  if (shouldSendWelcomeEmail) {
    const [welcomeResult, adminResult] = await Promise.all([
      sendNewsletterWelcomeEmail({ to: email }),
      sendNewsletterAdminNotification({ subscriberEmail: email, source }),
    ]);

    if (!welcomeResult.success || !adminResult.success) {
      appLogger.warn('newsletter.subscribe.email_failed', {
        ip,
        welcomeEmailSent: welcomeResult.success,
        adminEmailSent: adminResult.success,
      });
    }
  }

  return NextResponse.json({ success: true });
}
