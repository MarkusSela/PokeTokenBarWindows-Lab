const test = require('node:test');
const assert = require('node:assert/strict');
const { LiveUsageDisplay } = require('../core/live-usage.cjs');

function usage(tokens, providerTokens = tokens, date = '2026-08-30') {
  const stats = { tokens, cost: 0, sessions: 1 };
  return {
    date,
    today: { ...stats },
    week: { ...stats },
    month: { ...stats },
    todayProviders: [{ name: 'openai-codex', tokens: providerTokens, cost: 0, sessions: 1 }],
  };
}

function completeUsage(tokens, providerTokens = tokens, date = '2026-08-30') {
  const value = usage(tokens, providerTokens, date);
  for (const window of ['today', 'week', 'month']) value[window].input = tokens;
  value.todayProviders[0].input = providerTokens;
  return value;
}

test('live display adds old-session deltas to every visible usage window', () => {
  const display = new LiveUsageDisplay();
  display.apply(usage(100), { tokens: 0, byProvider: [] });
  const next = display.apply(usage(100), {
    tokens: 25,
    byProvider: [{ name: 'openai-codex', tokens: 25 }],
  });
  assert.equal(next.today.tokens, 125);
  assert.equal(next.week.tokens, 125);
  assert.equal(next.month.tokens, 125);
  assert.equal(next.todayProviders[0].tokens, 125);
});

test('live display does not double count a delta already present in Hermes windows', () => {
  const display = new LiveUsageDisplay();
  display.apply(usage(100), { tokens: 0, byProvider: [] });
  const next = display.apply(usage(125), {
    tokens: 25,
    byProvider: [{ name: 'openai-codex', tokens: 25 }],
  });
  assert.equal(next.today.tokens, 125);
  assert.equal(next.week.tokens, 125);
  assert.equal(next.month.tokens, 125);
  assert.equal(next.todayProviders[0].tokens, 125);
});

test('live display resets the accumulated correction at a new local date', () => {
  const display = new LiveUsageDisplay();
  display.apply(usage(100), { tokens: 0, byProvider: [] });
  display.apply(usage(100), { tokens: 25, byProvider: [{ name: 'openai-codex', tokens: 25 }] });
  const next = display.apply(usage(40, 40, '2026-08-31'), { tokens: 0, byProvider: [] });
  assert.equal(next.today.tokens, 40);
  assert.equal(next.todayProviders[0].tokens, 40);
});

test('live display persists its correction across an app restart', () => {
  const display = new LiveUsageDisplay();
  display.apply(completeUsage(100), { tokens: 0, byProvider: [] });
  display.apply(completeUsage(100), {
    tokens: 25,
    input: 25,
    byProvider: [{ name: 'openai-codex', tokens: 25, input: 25 }],
  });
  const restarted = new LiveUsageDisplay(display.exportState());
  const next = restarted.apply(completeUsage(100), { tokens: 0, byProvider: [] });
  assert.equal(next.today.tokens, 125);
  assert.equal(next.week.tokens, 125);
  assert.equal(next.month.tokens, 125);
  assert.equal(next.todayProviders[0].tokens, 125);
  assert.equal(next.todayProviders[0].input, 125);
});

test('live display carries every provider token counter with an old-session delta', () => {
  const display = new LiveUsageDisplay();
  const first = usage(100);
  first.todayProviders[0] = {
    name: 'openai-codex',
    tokens: 100,
    input: 40,
    output: 20,
    cacheRead: 40,
    cacheWrite: 0,
    reasoning: 0,
  };
  display.apply(first, { tokens: 0, byProvider: [] });
  const next = display.apply({ ...first, todayProviders: [{ ...first.todayProviders[0] }] }, {
    tokens: 25,
    input: 10,
    output: 5,
    cacheRead: 10,
    cacheWrite: 0,
    reasoning: 0,
    byProvider: [{ name: 'openai-codex', tokens: 25, input: 10, output: 5, cacheRead: 10 }],
  });
  assert.deepEqual(next.todayProviders[0], {
    name: 'openai-codex',
    tokens: 125,
    input: 50,
    output: 25,
    cacheRead: 50,
    cacheWrite: 0,
    reasoning: 0,
    cost: 0,
  });
});

test('today total follows provider totals when only the provider receives an old-session delta', () => {
  const display = new LiveUsageDisplay();
  display.apply(usage(100), { tokens: 0, byProvider: [] });
  const next = display.apply(usage(125, 100), {
    tokens: 25,
    byProvider: [{ name: 'openai-codex', tokens: 25 }],
  });
  assert.equal(next.today.tokens, 125);
  assert.equal(next.todayProviders[0].tokens, 125);
});

test('legacy numeric live corrections reset instead of creating an unexplained total', () => {
  const display = new LiveUsageDisplay({
    date: '2026-08-30',
    previousRaw: usage(100),
    extraByWindow: { today: 99, week: 99, month: 99 },
    extraByProvider: { 'openai-codex': 99 },
  });
  const next = display.apply(usage(100), { tokens: 0, byProvider: [] });
  assert.equal(next.today.tokens, 100);
  assert.equal(next.week.tokens, 100);
  assert.equal(next.month.tokens, 100);
  assert.equal(next.todayProviders[0].tokens, 100);
});
