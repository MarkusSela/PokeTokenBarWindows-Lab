const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readHermesUsage } = require('../core/hermes-usage.cjs');

test('Hermes usage exposes real provider/model aggregates for the Home view', async () => {
  const usage = await readHermesUsage();
  assert.ok(Array.isArray(usage.providers));
  assert.ok(usage.providers.length > 0);
  assert.ok(usage.providers.every(item => item.name && Number.isFinite(item.tokens)));
});

test('Home provider detail renders reasoning tokens', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /p\.reasoning/);
  assert.match(html, /tr\('reasoning'\)/);
});
