import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyNewsletterUnsubscribeToken } from '@/lib/newsletter-unsubscribe';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() || '';
  const token = request.nextUrl.searchParams.get('token') || '';
  const redirectUrl = new URL('/boletin/baja', request.url);

  if (!email || !verifyNewsletterUnsubscribeToken(email, token)) {
    redirectUrl.searchParams.set('status', 'invalid');
    return NextResponse.redirect(redirectUrl);
  }

  const admin = createAdminClient();
  if (!admin) {
    redirectUrl.searchParams.set('status', 'error');
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = await (admin as any)
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);

  redirectUrl.searchParams.set('status', error ? 'error' : 'success');
  return NextResponse.redirect(redirectUrl);
}
