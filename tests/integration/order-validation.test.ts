import { describe, expect, it } from 'vitest';
import {
  isValidIdempotencyKey,
  validateGuestOrderCreateInput,
  validateOrderCreateInput,
} from '@/lib/orders/validation';

describe('order create validation', () => {
  it('accepts a valid payload', () => {
    const result = validateOrderCreateInput({
      shipping: {
        recipientName: 'Juan Perez',
        phone: '55551234',
        streetAddress: '5ta Avenida 10-50',
        city: 'Ciudad de Guatemala',
        department: 'Guatemala',
      },
      couponCode: 'BIENVENIDA10',
      customerNotes: 'Entregar por la tarde',
      paymentMethod: 'bank_transfer',
    });

    expect(result.valid).toBe(true);
  });

  it('rejects payload with missing shipping fields', () => {
    const result = validateOrderCreateInput({
      shipping: {
        recipientName: '',
        phone: '123',
        streetAddress: '',
        city: '',
        department: '',
      },
      paymentMethod: 'bank_transfer',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('requires valid guest items and quantities', () => {
    const result = validateGuestOrderCreateInput({
      customerEmail: 'cliente@example.com',
      shipping: {
        recipientName: 'Cliente',
        phone: '55551234',
        streetAddress: '5ta Avenida 10-50',
        city: 'Ciudad de Guatemala',
        department: 'Guatemala',
      },
      paymentMethod: 'bank_transfer',
      items: [{ variantId: 'not-a-uuid', quantity: 1 }],
    });

    expect(result.valid).toBe(false);
  });

  it('validates idempotency keys used by checkout retries', () => {
    expect(isValidIdempotencyKey('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidIdempotencyKey('short')).toBe(false);
    expect(isValidIdempotencyKey('invalid key with spaces')).toBe(false);
  });
});
