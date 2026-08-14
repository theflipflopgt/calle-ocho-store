import { describe, expect, it } from 'vitest';
import { roundMoney } from '@/lib/utils/currency';

describe('roundMoney', () => {
  it('rounds monetary calculations to two decimal places', () => {
    expect(roundMoney(482.95 * 3)).toBe(1448.85);
    expect(roundMoney(10.005)).toBe(10.01);
  });

  it('does not propagate invalid numeric values', () => {
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
