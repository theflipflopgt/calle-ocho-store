import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { normalizeWhatsAppRecipient } from '@/lib/whatsapp/phone';
import { verifyWhatsAppWebhookSignature } from '@/lib/whatsapp/signature';

describe('WhatsApp Cloud API helpers', () => {
  it('normalizes a Guatemala phone number', () => {
    expect(normalizeWhatsAppRecipient('5555-1234')).toBe('50255551234');
    expect(normalizeWhatsAppRecipient('+502 5555 1234')).toBe('50255551234');
  });

  it('rejects invalid recipients', () => {
    expect(() => normalizeWhatsAppRecipient('123')).toThrow('INVALID_WHATSAPP_RECIPIENT');
  });

  it('verifies Meta webhook signatures without trusting malformed input', () => {
    const body = '{"object":"whatsapp_business_account"}';
    const secret = 'test-app-secret';
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    expect(verifyWhatsAppWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyWhatsAppWebhookSignature(`${body}x`, signature, secret)).toBe(false);
    expect(verifyWhatsAppWebhookSignature(body, 'sha256=bad', secret)).toBe(false);
  });
});

