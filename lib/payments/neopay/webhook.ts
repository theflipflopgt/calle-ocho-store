import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Temporary verification contract until NeoNet supplies the definitive webhook
 * signature specification. Keep NEO_PAY webhooks disabled in production until
 * this function is adapted to the official documentation and certified.
 */
export function verifyConfiguredWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.NEOPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const supplied = signature.replace(/^sha256=/i, '').trim();
  if (expected.length !== supplied.length) return false;

  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(supplied, 'utf8'));
}
