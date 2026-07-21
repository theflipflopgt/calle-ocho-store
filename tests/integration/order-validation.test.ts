import { describe, expect, it } from 'vitest';
import { validateOrderCreateInput } from '@/lib/orders/validation';

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
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
