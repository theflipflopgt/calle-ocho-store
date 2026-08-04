import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  suppliedSignature: string | null,
  appSecret: string
) {
  if (!suppliedSignature?.startsWith('sha256=') || !appSecret) return false;
  const suppliedHex = suppliedSignature.slice('sha256='.length);
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;

  const expected = Buffer.from(
    createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex'),
    'hex'
  );
  const supplied = Buffer.from(suppliedHex, 'hex');
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

