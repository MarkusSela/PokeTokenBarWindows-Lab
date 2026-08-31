const test = require('node:test');
const assert = require('node:assert/strict');
const { createFloatingPetController } = require('../core/floating-pet-controller.cjs');

function harness() {
  const calls = [];
  const locks = [];
  const window = {
    getPosition: () => [100, 200],
    setPosition: (x, y) => calls.push(['position', x, y]),
    setContentSize: (width, height) => calls.push(['size', width, height]),
    getContentSize: () => [96, 124],
    setResizable: value => locks.push(['resizable', value]),
    setMinimumSize: (width, height) => locks.push(['min', width, height]),
    setMaximumSize: (width, height) => locks.push(['max', width, height])
  };
  const saved = [];
  return { calls, locks, saved, window };
}

test('drag moves the pet without resizing it', () => {
  const h = harness();
  const controller = createFloatingPetController({ window: h.window, savePosition: value => h.saved.push(value) });
  controller.setSize(96);
  h.calls.length = 0;

  controller.beginDrag(110, 220);
  controller.moveDrag(160, 280);
  controller.endDrag(170, 300);

  assert.deepEqual(h.calls, [
    ['position', 150, 260],
    ['position', 160, 280]
  ]);
  assert.deepEqual(h.saved, [{ x: 160, y: 280 }]);
});

test('content size changes only through an explicit size update', () => {
  const h = harness();
  const controller = createFloatingPetController({ window: h.window, savePosition: () => {} });

  controller.setSize(96);
  controller.setSize(96);
  controller.beginDrag(110, 220);
  controller.moveDrag(150, 250);
  controller.setSize(215);
  controller.moveDrag(160, 260);

  assert.deepEqual(h.calls, [
    ['size', 96, 124],
    ['position', 140, 230],
    ['size', 215, 243],
    ['position', 150, 240]
  ]);
});

test('drag offset is preserved when the pointer starts inside the pet', () => {
  const h = harness();
  const controller = createFloatingPetController({ window: h.window, savePosition: () => {} });

  controller.setSize(96);
  controller.beginDrag(145, 255);
  controller.moveDrag(200, 300);

  assert.deepEqual(h.calls.at(-1), ['position', 155, 245]);
});


test('drag restores the locked native bounds if Windows changes them', () => {
  const h = harness();
  let bounds = { x: 100, y: 200, width: 96, height: 124 };
  h.window.getBounds = () => ({ ...bounds });
  h.window.setPosition = (x, y) => {
    bounds = { ...bounds, x, y, width: bounds.width + 3, height: bounds.height + 3 };
    h.calls.push(['position', x, y]);
  };
  h.window.setBounds = next => {
    bounds = { ...bounds, ...next };
    h.calls.push(['bounds', next.x, next.y, next.width, next.height]);
  };
  const controller = createFloatingPetController({ window: h.window, savePosition: () => {} });
  controller.setSize(96);
  h.calls.length = 0;

  controller.beginDrag(110, 220);
  controller.moveDrag(160, 280);

  assert.deepEqual(bounds, { x: 150, y: 260, width: 96, height: 124 });
  assert.deepEqual(h.calls, [
    ['position', 150, 260],
    ['bounds', 150, 260, 96, 124]
  ]);
});

test('explicit size updates lock the native pet bounds and dragging never changes the lock', () => {
  const h = harness();
  const controller = createFloatingPetController({ window: h.window, savePosition: () => {} });

  controller.setSize(96);
  const initialLockCount = h.locks.length;
  controller.beginDrag(110, 220);
  controller.moveDrag(180, 300);
  controller.endDrag(180, 300);

  assert.equal(h.locks.length, initialLockCount);
  assert.deepEqual(h.locks.slice(-3), [
    ['min', 96, 124],
    ['max', 96, 124],
    ['resizable', false]
  ]);
});
