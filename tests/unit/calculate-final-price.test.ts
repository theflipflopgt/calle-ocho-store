import { describe, expect, it } from 'vitest';
import { calculateFinalPrice } from '@/lib/pricing/calculate-final-price';

describe('calculateFinalPrice', () => {
  it('preserves the desired profit after card and invoice fees', () => {
    expect(calculateFinalPrice(325, 100, 7, 5)).toBe(482.95);
  });

  it('returns cost plus profit when there are no fees', () => {
    expect(calculateFinalPrice(325, 100, 0, 0)).toBe(425);
  });

  it('rejects fee totals of 100 percent or more', () => {
    expect(calculateFinalPrice(325, 100, 70, 30)).toBeNull();
    expect(calculateFinalPrice(325, 100, 80, 30)).toBeNull();
  });

  it('rejects negative business values', () => {
    expect(calculateFinalPrice(325, -1, 7, 5)).toBeNull();
  });
});
