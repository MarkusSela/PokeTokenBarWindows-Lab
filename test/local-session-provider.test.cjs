const test = require('node:test');
const assert = require('node:assert/strict');
const { providerAggregates } = require('../core/hermes-usage.cjs');

test('local session providers remain visible when today has no rows', () => {
  const providers = providerAggregates([
    {
      model: 'gpt-5-codex',
      billing_provider: '',
      started_at: 1_700_000_000,
      input_tokens: 10,
      output_tokens: 5,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
      reasoning_tokens: 0,
      actual_cost_usd: 0,
      estimated_cost_usd: 0,
    },
  ], 1_600_000_000);
  assert.deepEqual(providers.map(({ name, tokens, sessions }) => ({ name, tokens, sessions })), [
    { name: 'OpenAI', tokens: 15, sessions: 1 },
  ]);
});
