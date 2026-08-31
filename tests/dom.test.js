import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onPageHide } from '../src/utils/dom.js';

function pageWindow(t) {
  const previousWindow = globalThis.window;
  const target = new EventTarget();
  globalThis.window = target;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  return (persisted) =>
    target.dispatchEvent(Object.assign(new Event('pagehide'), { persisted }));
}

test('cached Back/Forward keeps sections alive until actual page disposal', (t) => {
  const hidePage = pageWindow(t);
  const cleanup = t.mock.fn();
  onPageHide([undefined, cleanup, null]);

  hidePage(true);
  assert.equal(cleanup.mock.callCount(), 0);
  hidePage(true);
  assert.equal(cleanup.mock.callCount(), 0);

  hidePage(false);
  assert.equal(cleanup.mock.callCount(), 1);
  hidePage(false);
  assert.equal(cleanup.mock.callCount(), 1);
});

test('ordinary navigation cleans up initialized sections once', (t) => {
  const hidePage = pageWindow(t);
  const first = t.mock.fn();
  const second = t.mock.fn();
  onPageHide([first, undefined, second]);

  hidePage(false);
  hidePage(false);
  assert.equal(first.mock.callCount(), 1);
  assert.equal(second.mock.callCount(), 1);
});
