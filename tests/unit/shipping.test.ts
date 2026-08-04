import { describe, expect, it } from 'vitest';
import { getDeliveryCoverage } from '@/lib/shipping';

describe('delivery coverage', () => {
  it('calculates capital delivery and free shipping consistently', () => {
    expect(getDeliveryCoverage('Guatemala', 'Ciudad de Guatemala', 999, false).shippingCost).toBe(35);
    expect(getDeliveryCoverage('Guatemala', 'Ciudad de Guatemala', 1000, false).shippingCost).toBe(0);
  });

  it('does not allow cash on delivery outside own delivery coverage', () => {
    const coverage = getDeliveryCoverage('Sacatepéquez', 'Antigua Guatemala', 500, true);
    expect(coverage.isOwnDelivery).toBe(false);
    expect(coverage.cashOnDeliveryAllowed).toBe(false);
  });
});
