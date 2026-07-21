import { describe, expect, it } from 'vitest';
import { canTransitionOrderStatus, isTerminalOrderStatus } from '@/lib/order-status';

describe('order status transitions', () => {
  it('allows valid transition pending -> paid', () => {
    expect(canTransitionOrderStatus('pending', 'paid')).toBe(true);
  });

  it('blocks invalid transition delivered -> processing', () => {
    expect(canTransitionOrderStatus('delivered', 'processing')).toBe(false);
  });

  it('marks terminal statuses correctly', () => {
    expect(isTerminalOrderStatus('delivered')).toBe(true);
    expect(isTerminalOrderStatus('cancelled')).toBe(true);
    expect(isTerminalOrderStatus('processing')).toBe(false);
  });
});
