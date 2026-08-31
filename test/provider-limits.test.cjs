const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLimitWindows, PUBLIC_LIMIT_SOURCES } = require('../core/provider-limits.cjs');
const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');

test('limit windows accept only explicit account data and clamp utilization', () => {
  const result = normalizeLimitWindows([{ key:'codex-5h', kind:'session', utilization:120, provider:'openai-codex', resetAt:'2026-08-29T15:00:00Z' }, { kind:'unknown', utilization:50 }, { kind:'weekly', utilization:'bad' }]);
  assert.deepEqual(result, [{ key:'codex-5h', kind:'session', utilization:100, provider:'openai-codex', resetAt:'2026-08-29T15:00:00Z' }]);
  assert.match(PUBLIC_LIMIT_SOURCES['openai-codex'],/11369540-using-codex-with-your-chatgpt-plan/);
});

test('limits UI distinguishes unavailable official data from a zero utilization bar', () => {
  assert.match(html, /limitsUnavailable/);
  assert.match(html, /officialAvailable/);
  assert.match(html, /local usage from supported providers is still counted/);
  assert.doesNotMatch(html, /local Hermes usage only/);
});
