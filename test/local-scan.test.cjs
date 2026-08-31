const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { scanAdditionalFolders } = require('../core/local-scan.cjs');

test('advanced scan aggregates token counters read-only and ignores prompt text', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-scan-'));
  fs.mkdirSync(path.join(root, 'nested'));
  fs.writeFileSync(path.join(root, 'usage.json'), JSON.stringify({ input_tokens: 10, output_tokens: 4, cache_read_tokens: 2, cache_write_tokens: 1, prompt: 'do not retain this' }));
  fs.writeFileSync(path.join(root, 'nested', 'usage.jsonl'), '{"inputTokens":5,"outputTokens":3}\n{"input_tokens":2,"output_tokens":1}\n');
  const result = await scanAdditionalFolders([root]);
  assert.equal(result.totalRows, 3);
  assert.equal(result.today.tokens, 28);
  assert.equal(result.today.input, 17);
  assert.equal(result.today.output, 8);
  assert.equal(JSON.stringify(result).includes('prompt'), false);
  assert.equal(result.providers.length, 1);
  assert.equal(result.unattributedRows, 3);
});

test('advanced scan assigns timestamped rows to real local windows', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-scan-time-'));
  const now = new Date(2026, 7, 30, 12, 0, 0);
  fs.writeFileSync(path.join(root, 'usage.jsonl'), [
    JSON.stringify({ timestamp: '2026-08-30T10:00:00', input_tokens: 10 }),
    JSON.stringify({ timestamp: '2026-08-29T12:00:00', output_tokens: 20 }),
    JSON.stringify({ timestamp: '2026-08-24T12:00:00', output_tokens: 30 }),
    JSON.stringify({ timestamp: '2026-08-01T12:00:00', output_tokens: 40 }),
    JSON.stringify({ timestamp: '2026-07-01T12:00:00', output_tokens: 50 }),
  ].join('\n'));
  const result = await scanAdditionalFolders([root], { now });
  assert.equal(result.today.tokens, 10);
  assert.equal(result.block5h.tokens, 10);
  assert.equal(result.week.tokens, 60);
  assert.equal(result.month.tokens, 100);
  assert.equal(result.unattributedRows, 0);
});

test('advanced scan keeps historical providers out of the today provider breakdown', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-scan-today-providers-'));
  fs.writeFileSync(path.join(root, 'usage.jsonl'), [
    JSON.stringify({ provider: 'old', input_tokens: 10, timestamp: '2026-08-01T10:00:00' }),
    JSON.stringify({ provider: 'today', input_tokens: 20, timestamp: '2026-08-30T10:00:00' }),
  ].join('\n'));
  const result = await scanAdditionalFolders([root], { now: new Date(2026, 7, 30, 12) });
  assert.deepEqual(result.todayProviders.map((provider) => provider.name), ['today']);
  assert.deepEqual(result.providers.map((provider) => provider.name), ['today', 'old']);
});
