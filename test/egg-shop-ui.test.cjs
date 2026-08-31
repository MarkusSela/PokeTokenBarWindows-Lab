const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');

test('shop keeps all egg cards visible even without an active Pokémon', () => {
  assert.doesNotMatch(html, /\$\{active\?shopCard\('Pokémon Egg'/);
  assert.doesNotMatch(html, /\$\{active\?shopCard\('Uncommon Egg/);
  assert.doesNotMatch(html, /\$\{active\?shopCard\('Rare Egg/);
});
