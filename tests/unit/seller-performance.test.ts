import { describe, expect, it } from 'vitest';
import { calculateSellerPerformance } from '@/lib/admin/seller-performance';

describe('calculateSellerPerformance', () => {
  it('shows pending work without counting it as a completed sale', () => {
    const result = calculateSellerPerformance([
      {
        status: 'pending',
        total: 500,
        seller_commission_amount: 50,
        order_items: [{ quantity: 1 }],
      },
      {
        status: 'paid',
        total: 482.95,
        seller_commission_amount: 48.3,
        order_items: [{ quantity: 2 }],
      },
    ]);

    expect(result).toEqual({
      assigned: 2,
      pairs: 2,
      sales: 482.95,
      commission: 48.3,
    });
  });

  it('excludes cancelled and refunded orders', () => {
    const result = calculateSellerPerformance([
      {
        status: 'cancelled',
        total: 300,
        seller_commission_amount: 30,
        order_items: [{ quantity: 1 }],
      },
      {
        status: 'refunded',
        total: 400,
        seller_commission_amount: 40,
        order_items: [{ quantity: 2 }],
      },
    ]);

    expect(result).toEqual({ assigned: 0, pairs: 0, sales: 0, commission: 0 });
  });
});
