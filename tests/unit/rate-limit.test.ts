import { describe, expect, it } from 'vitest';
import { consumeRateLimit } from '@/lib/rate-limit';

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
});
