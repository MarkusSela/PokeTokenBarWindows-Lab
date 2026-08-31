const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const initSqlJs = require('sql.js');
const os = require('node:os');
const path = require('node:path');
const { readHermesUsage } = require('../core/hermes-usage.cjs');

test('Hermes usage exposes real provider/model aggregates for the Home view', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-hermes-usage-'));
  const databaseFile = path.join(root, 'state.db');
  let database;
  const now = new Date(2026, 7, 30, 12, 0, 0);
  try {
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(path.dirname(require.resolve('sql.js/dist/sql-wasm.js')), file),
    });
    database = new SQL.Database();
    database.run(`CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      model TEXT,
      billing_provider TEXT,
      started_at INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      cache_read_tokens INTEGER,
      cache_write_tokens INTEGER,
      reasoning_tokens INTEGER,
      estimated_cost_usd REAL,
      actual_cost_usd REAL
    )`);
    database.run(`INSERT INTO sessions VALUES ('session-1', 'gpt-5', '', ${Math.floor(now.getTime() / 1000)}, 10, 5, 2, 1, 3, 0.01, 0.02)`);
    fs.writeFileSync(databaseFile, Buffer.from(database.export()));
    database.close();
    database = null;

    const usage = await readHermesUsage(now, databaseFile);
    assert.deepEqual(usage.providers, [{
      name: 'OpenAI',
      tokens: 21,
      cost: 0.02,
      sessions: 1,
      input: 10,
      output: 5,
      cacheRead: 2,
      cacheWrite: 1,
      reasoning: 3,
    }]);
    assert.equal(usage.today.tokens, 21);
  } finally {
    database?.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Home provider detail renders reasoning tokens', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /p\.reasoning/);
  assert.match(html, /tr\('reasoning'\)/);
});
