const test = require('node:test');
const assert = require('node:assert/strict');

test('live refresh publishes a new snapshot to an open renderer', () => {
  const { publishSnapshot } = require('../core/live-update.cjs');
  const messages = [];
  const windowLike = { isDestroyed: () => false, webContents: { send: (...args) => messages.push(args) } };

  publishSnapshot(windowLike, { usage: { today: { tokens: 123 } } });

  assert.deepEqual(messages, [['usage-updated', { usage: { today: { tokens: 123 } } }]]);
});

test('live refresh does not publish after the window is destroyed', () => {
  const { publishSnapshot } = require('../core/live-update.cjs');
  const messages = [];
  const windowLike = { isDestroyed: () => true, webContents: { send: (...args) => messages.push(args) } };

  publishSnapshot(windowLike, { usage: { today: { tokens: 123 } } });

  assert.deepEqual(messages, []);
});
