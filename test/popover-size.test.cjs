const test = require('node:test');
const assert = require('node:assert/strict');
const { clampPopoverHeight } = require('../core/popover-size.cjs');

test('popover height follows short content instead of sticking to the previous height', () => {
  assert.equal(clampPopoverHeight(340, 1080), 340);
  assert.equal(clampPopoverHeight(1080, 900), 900);
});

test('popover height keeps only a small native safety floor', () => {
  assert.equal(clampPopoverHeight(0, 1080), 220);
});
