const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const audit = fs.readFileSync(path.join(root, 'scripts', 'audit-release.cjs'), 'utf8');

test('release audit scans the complete public repository tree', () => {
  assert.match(audit, /const sourceRoots = \[\s*['"]\.['"]\s*\]/);
  const result = spawnSync(process.execPath, ['scripts/audit-release.cjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.safe, true);
  assert.ok(summary.scannedSourceFiles >= 40);
});

test('release audit recognizes credential-bearing file types and private key markers', () => {
  assert.match(audit, /private key/i);
  assert.match(audit, /db/);
  assert.match(audit, /sqlite/);
  assert.match(audit, /pem\|p12/);
  assert.match(audit, /api.*key/i);
  assert.match(audit, /github_pat_/);
});

test('release audit fails closed when a release directory is missing', () => {
  const missingRelease = path.join(root, '.missing-release-directory-for-audit-test');
  const result = spawnSync(process.execPath, ['scripts/audit-release.cjs', missingRelease], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /release directory/i);
});

test('release audit fails closed when a release directory is empty', () => {
  const emptyRelease = fs.mkdtempSync(path.join(root, '.empty-release-directory-'));
  try {
    const result = spawnSync(process.execPath, ['scripts/audit-release.cjs', emptyRelease], {
      cwd: root,
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /release directory/i);
  } finally {
    fs.rmSync(emptyRelease, { recursive: true, force: true });
  }
});

test('release audit does not treat binary executable bytes as text credentials', () => {
  const binaryRelease = fs.mkdtempSync(path.join(root, '.binary-release-directory-'));
  const binaryNoise = Buffer.concat([
    Buffer.from([0, 255, 16, 128]),
    Buffer.from(['to', 'ken', ': ', 'abcdefghijklmno'].join('')),
    Buffer.from([0, 1, 2, 3]),
  ]);
  fs.writeFileSync(path.join(binaryRelease, 'fixture.exe'), binaryNoise);

  try {
    const result = spawnSync(process.execPath, ['scripts/audit-release.cjs', binaryRelease], {
      cwd: root,
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout).findings, []);
  } finally {
    fs.rmSync(binaryRelease, { recursive: true, force: true });
  }
});

test('release audit fails closed when a release file cannot be read', () => {
  const unreadableRelease = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-unreadable-release-'));
  const unreadableFile = path.join(unreadableRelease, 'fixture.txt');
  fs.writeFileSync(unreadableFile, 'safe release fixture\n');
  const script = path.join(root, 'scripts', 'audit-release.cjs');
  const probe = [
    "const fs = require('node:fs');",
    `const target = ${JSON.stringify(unreadableFile)};`,
    'const originalReadFileSync = fs.readFileSync;',
    "fs.readFileSync = (file, ...args) => { if (file === target) { const error = new Error('blocked'); error.code = 'EACCES'; throw error; } return originalReadFileSync(file, ...args); };",
    `process.argv = [process.argv[0], 'audit-release.cjs', ${JSON.stringify(unreadableRelease)}];`,
    `require(${JSON.stringify(script)});`,
  ].join('\n');

  try {
    const result = spawnSync(process.execPath, ['-e', probe], {
      cwd: root,
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /"safe": false/);
    assert.match(`${result.stdout}\n${result.stderr}`, /could not read|EACCES/i);
  } finally {
    fs.rmSync(unreadableRelease, { recursive: true, force: true });
  }
});

test('release audit fails closed when release traversal is unreadable', () => {
  const unreadableRelease = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-blocked-release-'));
  const script = path.join(root, 'scripts', 'audit-release.cjs');
  const probe = [
    "const fs = require('node:fs');",
    `const target = ${JSON.stringify(unreadableRelease)};`,
    'const originalReaddirSync = fs.readdirSync;',
    "fs.readdirSync = (directory, ...args) => { if (directory === target) { const error = new Error('blocked'); error.code = 'EACCES'; throw error; } return originalReaddirSync(directory, ...args); };",
    `process.argv = [process.argv[0], 'audit-release.cjs', ${JSON.stringify(unreadableRelease)}];`,
    `require(${JSON.stringify(script)});`,
  ].join('\n');

  try {
    const result = spawnSync(process.execPath, ['-e', probe], {
      cwd: root,
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /"safe": false/);
    assert.match(`${result.stdout}\n${result.stderr}`, /could not be inspected|EACCES|release directory/i);
  } finally {
    fs.rmSync(unreadableRelease, { recursive: true, force: true });
  }
});

test('release audit blocks binary files with forbidden state names', () => {
  const binaryRelease = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-binary-state-release-'));
  fs.writeFileSync(path.join(binaryRelease, 'companion-state.json'), Buffer.from([0, 1, 2, 3]));

  try {
    const result = spawnSync(process.execPath, ['scripts/audit-release.cjs', binaryRelease], {
      cwd: root,
      encoding: 'utf8',
    });
    const summary = JSON.parse(result.stdout);

    assert.notEqual(result.status, 0);
    assert.equal(summary.findings.some((finding) => finding.artifactHit), true);
  } finally {
    fs.rmSync(binaryRelease, { recursive: true, force: true });
  }
});

test('release audit blocks binary SQLite sidecars by filename', () => {
  const binaryRelease = fs.mkdtempSync(path.join(os.tmpdir(), 'ptb-binary-sqlite-release-'));
  const forbiddenNames = ['usage.sqlite', 'usage.db-wal', 'usage.db-shm'];
  for (const name of forbiddenNames) fs.writeFileSync(path.join(binaryRelease, name), Buffer.from([0, 1, 2, 3]));

  try {
    const result = spawnSync(process.execPath, ['scripts/audit-release.cjs', binaryRelease], {
      cwd: root,
      encoding: 'utf8',
    });
    const summary = JSON.parse(result.stdout);

    assert.notEqual(result.status, 0);
    assert.equal(summary.findings.filter((finding) => finding.artifactHit).length, forbiddenNames.length);
  } finally {
    fs.rmSync(binaryRelease, { recursive: true, force: true });
  }
});
