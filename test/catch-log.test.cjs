const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCatchLogEntries } = require('../core/catch-log.cjs');

test('catch log keeps the active individual separate from graduated individuals', () => {
  const entries = buildCatchLogEntries({
    active: { baseId: 543, pathIds: [543, 544], stageIndex: 1, nature: 'Gentle', rarity: 'common' },
    dex: [{ id: 'graduated-1', baseId: 543, finalId: 545, chainOrder: [543, 544, 545], caughtAt: '2026-08-28T12:00:00.000Z', nature: 'Hardy', rarity: 'common' }],
  });
  assert.equal(entries.length, 2);
  assert.notEqual(entries[0].id, entries[1].id);
  assert.equal(entries[0].kind, 'active');
  assert.equal(entries[1].kind, 'graduated');
});

test('each catch-log entry preserves its individual evolution chain', () => {
  const entries = buildCatchLogEntries({
    dex: [
      { id: 'a', baseId: 1, finalId: 3, chainOrder: [1, 2, 3], caughtAt: '2026-08-28T12:00:00.000Z' },
      { id: 'b', baseId: 1, finalId: 3, chainOrder: [1, 2, 3], caughtAt: '2026-08-29T12:00:00.000Z' },
    ],
  });
  assert.deepEqual(entries.map((entry) => entry.id), ['b', 'a']);
  assert.deepEqual(entries.map((entry) => entry.chainOrder), [[1, 2, 3], [1, 2, 3]]);
});
