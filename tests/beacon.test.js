import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sendBeaconJSON } from '../src/utils/beacon.js';

function browserTransport(t, sendBeacon) {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator'
  );
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { sendBeacon },
  });
  t.after(() => {
    if (navigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
    } else {
      delete globalThis.navigator;
    }
  });
  return t.mock.method(globalThis, 'fetch', async () => ({}));
}

test('accepted beacon sends JSON without a duplicate fetch', async (t) => {
  const beacon = t.mock.fn(() => true);
  const fetch = browserTransport(t, beacon);
  const data = { path: '/' };

  assert.equal(sendBeaconJSON('/api/homepage-visit', data), undefined);

  assert.equal(beacon.mock.callCount(), 1);
  const [url, payload] = beacon.mock.calls[0].arguments;
  assert.equal(url, '/api/homepage-visit');
  assert.equal(payload.type, 'application/json');
  assert.deepEqual(JSON.parse(await payload.text()), data);
  assert.equal(fetch.mock.callCount(), 0);
});

for (const [scenario, sendBeacon] of [
  ['rejected', () => false],
  ['unavailable', undefined],
]) {
  test(`${scenario} beacon falls back to a keepalive JSON POST`, (t) => {
    const fetch = browserTransport(t, sendBeacon);
    const data = { slug: 'every' };

    assert.equal(sendBeaconJSON('/api/portfolio-unlock', data), undefined);

    assert.equal(fetch.mock.callCount(), 1);
    assert.deepEqual(fetch.mock.calls[0].arguments, [
      '/api/portfolio-unlock',
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      },
    ]);
  });
}

test('fallback fetch rejection remains fire-and-forget', async (t) => {
  const fetch = browserTransport(t, () => false);
  fetch.mock.mockImplementation(async () => {
    throw new Error('Network unavailable');
  });

  assert.equal(sendBeaconJSON('/api/homepage-visit', {}), undefined);
  assert.equal(fetch.mock.callCount(), 1);
  await new Promise((resolve) => setImmediate(resolve));
});

test('beacon exceptions keep their existing behavior', (t) => {
  const failure = new Error('Beacon error');
  const fetch = browserTransport(t, () => {
    throw failure;
  });

  assert.throws(() => sendBeaconJSON('/api/homepage-visit', {}), failure);
  assert.equal(fetch.mock.callCount(), 0);
});
