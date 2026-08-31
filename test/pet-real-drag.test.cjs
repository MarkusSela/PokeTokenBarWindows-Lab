const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const main = fs.readFileSync(path.join(__dirname, '..', 'main.cjs'), 'utf8');
const floating = fs.readFileSync(path.join(__dirname, '..', 'floating.html'), 'utf8');
const controller = fs.readFileSync(path.join(__dirname, '..', 'core', 'floating-pet-controller.cjs'), 'utf8');

test('real pet drag path never changes content size or native bounds', () => {
  assert.match(main, /petController\?\.moveDrag|petController\?\.beginDrag|petController\?\.endDrag/);
  assert.match(controller, /setContentSize\(size, height\)/);
  assert.doesNotMatch(main, /pet-move[\s\S]{0,300}setContentSize/);
  assert.doesNotMatch(floating, /window\.innerWidth|window\.innerHeight|100vw|100vh/);
});
