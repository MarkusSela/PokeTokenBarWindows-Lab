const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readLocalProviderUsage } = require('../core/provider-usage.cjs');
const { readHermesUsage } = require('../core/hermes-usage.cjs');

test('local provider reader aggregates Claude, Gemini CLI, and Codex independently', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-provider-usage-'));
  const now = new Date(2026, 7, 30, 12, 0, 0);
  const timestamp = now.toISOString();
  const roots = Object.fromEntries(['claude_code', 'gemini', 'codex'].map((name) => {
    const directory = path.join(root, name);
    fs.mkdirSync(directory, { recursive: true });
    return [name, [directory]];
  }));

  fs.writeFileSync(
    path.join(roots.claude_code[0], 'session.jsonl'),
    `${JSON.stringify({
      type: 'assistant',
      requestId: 'req-1',
      timestamp,
      message: {
        id: 'message-1',
        model: 'claude-sonnet',
        usage: {
          input_tokens: 10,
          output_tokens: 5,
          cache_creation_input_tokens: 2,
          cache_read_input_tokens: 3,
        },
      },
    })}\n`,
  );
  fs.writeFileSync(
    path.join(roots.gemini[0], 'session.jsonl'),
    `${JSON.stringify({
      type: 'gemini',
      id: 'gemini-1',
      timestamp,
      model: 'gemini-2.5-pro',
      tokens: { input: 20, cached: 5, tool: 2, output: 3, thoughts: 1 },
    })}\n`,
  );
  fs.writeFileSync(
    path.join(roots.codex[0], 'rollout.jsonl'),
    [
      JSON.stringify({ type: 'session_meta', payload: { id: 'codex-session' } }),
      JSON.stringify({
        type: 'event_msg',
        timestamp,
        payload: {
          type: 'token_count',
          info: {
            last_token_usage: {
              input_tokens: 30,
              cached_input_tokens: 10,
              output_tokens: 4,
            },
          },
        },
      }),
    ].join('\n') + '\n',
  );

  try {
    const usage = await readLocalProviderUsage(now, { roots });
    assert.equal(usage.today.tokens, 20 + 26 + 34);
    assert.deepEqual(
      usage.todayProviders.map(({ name, tokens }) => [name, tokens]),
      [
        ['Codex', 34],
        ['Gemini', 26],
        ['Claude Code', 20],
      ],
    );
    assert.equal(usage.progressionRows.length, 3);
    assert.deepEqual(
      usage.progressionRows.map(({ provider }) => provider).sort(),
      ['Claude Code', 'Codex', 'Gemini'],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('missing Hermes database does not block other local providers', async () => {
  const usage = await readHermesUsage(
    new Date(2026, 7, 30, 12, 0, 0),
    path.join(os.tmpdir(), 'ptb-no-hermes', 'state.db'),
  );
  assert.equal(usage.today.tokens, 0);
  assert.deepEqual(usage.providers, []);
  assert.equal(usage.officialAvailable, false);
});
