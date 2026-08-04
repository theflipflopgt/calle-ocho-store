import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';

test('storefront, security headers and robots are reachable', async () => {
  const home = await fetch(baseUrl, { redirect: 'manual' });
  assert.ok([200, 307, 308].includes(home.status), `unexpected home status ${home.status}`);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('x-frame-options'), 'DENY');

  const robots = await fetch(`${baseUrl}/robots.txt`);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \/admin\//);
});

test('NeoPay reports disabled readiness without accepting payments', async () => {
  const response = await fetch(`${baseUrl}/api/payments/neopay/readiness`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.enabled, false);
});
