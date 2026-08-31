const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldHidePopoverOnBlur } = require('../core/popover-focus-policy.cjs');

test('popover stays open when focus changes but the pointer is still inside it', () => {
  assert.equal(shouldHidePopoverOnBlur({
    quitting: false,
    focused: false,
    cursor: { x: 120, y: 220 },
    bounds: { x: 100, y: 200, width: 360, height: 600 }
  }), false);
});

test('popover hides after focus is lost and the pointer is outside its bounds', () => {
  assert.equal(shouldHidePopoverOnBlur({
    quitting: false,
    focused: false,
    cursor: { x: 700, y: 900 },
    bounds: { x: 100, y: 200, width: 360, height: 600 }
  }), true);
});

test('popover never hides while quitting or while it is focused', () => {
  assert.equal(shouldHidePopoverOnBlur({
    quitting: true,
    focused: false,
    cursor: { x: 700, y: 900 },
    bounds: { x: 100, y: 200, width: 360, height: 600 }
  }), false);
  assert.equal(shouldHidePopoverOnBlur({
    quitting: false,
    focused: true,
    cursor: { x: 700, y: 900 },
    bounds: { x: 100, y: 200, width: 360, height: 600 }
  }), false);
});
