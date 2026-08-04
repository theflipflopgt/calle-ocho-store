import { afterEach, describe, expect, it } from 'vitest';
import {
  createNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from '@/lib/newsletter-unsubscribe';

const previousSecret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;

afterEach(() => {
  if (previousSecret === undefined) {
    delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  } else {
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = previousSecret;
  }
});

describe('newsletter unsubscribe token', () => {
  it('accepts only the signed normalized email', () => {
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'test-secret-at-least-for-unit-tests';
    const token = createNewsletterUnsubscribeToken(' Cliente@Example.com ');

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyNewsletterUnsubscribeToken('cliente@example.com', token!)).toBe(true);
    expect(verifyNewsletterUnsubscribeToken('otro@example.com', token!)).toBe(false);
  });
});
