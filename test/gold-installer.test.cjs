const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gold = fs.readFileSync(path.join(root, 'gold.html'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'core', 'settings.cjs'), 'utf8');

test('Gold GIF asset is shipped by the Lab project', () => {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'gold-companion-walking.gif')));
});

test('settings expose Gold walking size with a midpoint default', () => {
  assert.match(settings, /goldWalkingSize/);
  assert.match(html, /goldWalkingSize/);
  assert.match(html, /Camminando con Gold/);
  assert.match(html, /walkingGold/);
});

test('Gold animation uses the supplied GIF and randomizes horizontal route and height', () => {
  assert.match(gold, /gold-companion-walking\.gif/);
  assert.match(gold, /Math\.random\(\)/);
  assert.match(gold, /await sleep\(800\)/);
  assert.match(gold, /\[1600, 2200, 2200, 1600\]/);
  assert.match(gold, /scaleX/);
});

test('Gold walking sprite is mirrored so Gold walks forward', () => {
  assert.match(gold, /direction > 0 \? 'scaleX\(1\)' : 'scaleX\(-1\)'/);
});
