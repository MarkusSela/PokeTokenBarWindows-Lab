const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { seedLabState, addTestTokens, EXTRA_TOKENS_50B } = require('../scripts/seed-lab-state.cjs');

test('Lab seed adds exactly ten billion spendable tokens and multiple test items once', () => {
  const file = path.join(__dirname, 'fixtures', 'lab-seed-state.json');
  fs.rmSync(file, { force: true });
  const initial = { usedSinceInstall: 100, spentTokens: 0, inventory: {}, oneTimeGrants: {}, active: { baseId: 1 } };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(initial));
  const first = seedLabState(file);
  const second = seedLabState(file);
  assert.equal(first.usedSinceInstall, 10_000_000_100);
  assert.equal(second.usedSinceInstall, 10_000_000_100);
  assert.ok(first.inventory.mint >= 2);
  assert.ok(first.inventory.rareCandy >= 2);
  assert.deepEqual(second.inventory, first.inventory);
  fs.rmSync(file, { force: true });
});

test('large Lab fixture adds fifty billion test tokens and 999 rare candies once', () => {
  const file = path.join(__dirname, 'fixtures', 'lab-seed-50b-state.json');
  fs.rmSync(file, { force: true });
  const initial = { usedSinceInstall: 321, spentTokens: 0, inventory: { rareCandy: 2 }, oneTimeGrants: {} };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(initial));
  const first = addTestTokens(file);
  const second = addTestTokens(file);
  assert.equal(first.usedSinceInstall, 321 + EXTRA_TOKENS_50B);
  assert.equal(second.usedSinceInstall, first.usedSinceInstall);
  assert.equal(first.inventory.rareCandy, 1001);
  assert.equal(second.inventory.rareCandy, 1001);
  assert.equal(second.oneTimeGrants['lab-seed-50-billion-v2'], true);
  assert.equal(second.oneTimeGrants['lab-seed-999-rare-candy-v1'], true);
  fs.rmSync(file, { force: true });
});
