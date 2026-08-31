const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const main = fs.readFileSync(path.join(__dirname, '..', 'main.cjs'), 'utf8');

test('Lab copy has an independent application identity and data folder', () => {
  assert.equal(pkg.name, 'poketokenbar-windows-lab');
  assert.equal(pkg.build.appId, 'com.poketokenbar.windows.lab');
  assert.equal(pkg.build.productName, 'PokeTokenBar Windows Lab');
  assert.match(main, /PokeTokenBarWindows-Lab/);
});
