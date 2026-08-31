const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  eggAnimationPlan,
  shouldStartEggPulse,
} = require('../core/egg-animation.cjs');

test('egg animation is static in the shop and pulses every five minutes below 30 percent', () => {
  assert.deepEqual(eggAnimationPlan('shop', 0.8), { mode: 'static', intervalMs: null });
  assert.deepEqual(eggAnimationPlan('home', 0.14), { mode: 'pulse', intervalMs: 300000 });
  assert.deepEqual(eggAnimationPlan('home', 0.29), { mode: 'pulse', intervalMs: 300000 });
});

test('egg animation uses five, three, and one minute pulse intervals', () => {
  assert.equal(eggAnimationPlan('home', 0.30).intervalMs, 180000);
  assert.equal(eggAnimationPlan('home', 0.60).intervalMs, 60000);
});

test('egg animation becomes continuous at 90 percent', () => {
  assert.deepEqual(eggAnimationPlan('home', 0.90), { mode: 'continuous', intervalMs: 0 });
});

test('egg pulse waits for the interval and restarts its timer on each opening', () => {
  const plan = eggAnimationPlan('home', 0.29);
  assert.equal(shouldStartEggPulse({ openedAt: 1000, now: 299999, lastPulseAt: 1000, plan }), false);
  assert.equal(shouldStartEggPulse({ openedAt: 1000, now: 301000, lastPulseAt: 1000, plan }), true);
  assert.equal(shouldStartEggPulse({ openedAt: 2000, now: 301000, lastPulseAt: 1000, plan }), false);
});

test('egg renderer starts the first pulse after a late snapshot render', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /eggPulseSessionToken/);
  assert.match(html, /if\(plan\.mode==='pulse'\)/);
  assert.match(html, /eggPulseSessionToken!==eggSessionToken/);
  assert.match(html, /syncOpeningEgg/);
  assert.match(html, /setTimeout\(syncOpeningEgg,100\)/);
});
