import { describe, expect, it } from 'vitest';
import { canTransitionOrderStatus, isTerminalOrderStatus } from '@/lib/order-status';

describe('order status transitions', () => {
  it('allows valid transition pending -> paid', () => {
    expect(canTransitionOrderStatus('pending', 'paid')).toBe(true);
  });

  it('does not allow an unpaid pending order to start processing', () => {
    expect(canTransitionOrderStatus('pending', 'processing')).toBe(false);
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
