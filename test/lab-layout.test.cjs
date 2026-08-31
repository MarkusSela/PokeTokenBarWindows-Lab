const test = require('node:test');
const assert = require('node:assert/strict');
const { resetAfterExternalDismiss, sectionViewport } = require('../core/layout-state.cjs');

test('external dismissal always resets the next opening to Home', () => {
  assert.deepEqual(
    resetAfterExternalDismiss({ tab: 'settings', settingsOpen: true, scrollTop: 240 }),
    { tab: 'home', settingsOpen: false, scrollTop: 0 },
  );
});

test('internal interactions do not reset the current section', () => {
  const state = { tab: 'shop', settingsOpen: false, scrollTop: 120 };
  assert.deepEqual(resetAfterExternalDismiss(state, { external: false }), state);
});

test('every section receives the full fixed viewport', () => {
  assert.deepEqual(sectionViewport(600), { minHeight: 600, height: 600, overflow: 'hidden' });
});
