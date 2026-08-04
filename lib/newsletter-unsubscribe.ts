import { createHmac, timingSafeEqual } from 'crypto';

function getSecret() {
  return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.INTERNAL_API_KEY || null;
}

export function createNewsletterUnsubscribeToken(email: string) {
  const secret = getSecret();
  if (!secret) return null;
  return createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex');
}

export function verifyNewsletterUnsubscribeToken(email: string, supplied: string) {
  const expected = createNewsletterUnsubscribeToken(email);
  if (!expected || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'));
}
