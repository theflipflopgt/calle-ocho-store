import { describe, expect, it } from 'vitest';
import { consumePersistentRateLimit, consumeRateLimit } from '@/lib/rate-limit';

describe('consumeRateLimit', () => {
  it('allows requests under the limit and blocks when exceeded', () => {
    const key = `test-${Date.now()}`;

    const first = consumeRateLimit({
      bucket: 'unit-rate-limit',
      key,
      max: 2,
      windowMs: 1_000,
    });

    const second = consumeRateLimit({
      bucket: 'unit-rate-limit',
      key,
      max: 2,
      windowMs: 1_000,
    });

    const third = consumeRateLimit({
      bucket: 'unit-rate-limit',
      key,
      max: 2,
      windowMs: 1_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('fails closed when the persistent database limiter is unavailable', async () => {
    const db = {
      rpc: async () => ({ data: null, error: { message: 'database unavailable' } }),
    };
    const result = await consumePersistentRateLimit({
      bucket: 'checkout',
      key: `persistent-${Date.now()}`,
      max: 5,
      windowMs: 60_000,
      db,
      failClosed: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(30);
  });
});
