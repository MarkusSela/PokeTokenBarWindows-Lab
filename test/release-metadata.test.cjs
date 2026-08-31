const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('release metadata uses the final release identity and project links', () => {
  const packageJson = JSON.parse(read('package.json'));
  const readme = read('README.md');
  const changelog = read('CHANGELOG.md');
  const release = read('RELEASE.md');
  const funding = read('.github/FUNDING.yml');

  assert.equal(packageJson.repository.url, 'https://github.com/MarkusSela/PokeTokenBarWindows-Lab.git');
  assert.equal(packageJson.homepage, 'https://github.com/MarkusSela/PokeTokenBarWindows-Lab');
  assert.equal(packageJson.description, 'A local-first desktop companion that turns AI coding usage into Pokémon progress.');
  assert.equal(packageJson.private, undefined);
  assert.match(readme, /MarkusSela\/PokeTokenBarWindows-Lab/);
  assert.match(readme, /https:\/\/ko-fi\.com\/marukoshi/);
  assert.match(funding, /https:\/\/ko-fi\.com\/marukoshi/);
  assert.match(readme, /## About this project/);
  assert.match(readme, /## 📸 Screenshots/);
  assert.match(readme, /## 📦 Install/);
  assert.match(changelog, /## \[0\.1\.0\] — first release/);
  for (const document of [readme, changelog, release]) {
    assert.doesNotMatch(document, /private preview|private-preview|preview build|early Windows preview/i);
  }
  assert.doesNotMatch(readme, /platform-/i);
  assert.doesNotMatch(readme, /Support future ports|future companion ports/i);
});

test('Windows packaging never triggers implicit GitHub publishing', () => {
  const packageJson = JSON.parse(read('package.json'));

  assert.match(packageJson.scripts.dist, /electron-builder --win nsis --publish never/);
});

test('README screenshot table references only existing documentation images', () => {
  const readme = read('README.md');
  const imagePaths = [...readme.matchAll(/(?:src|href)="(docs\/images\/[^"?#]+\.(?:png|gif))"/g)].map((match) => match[1]);

  assert.equal(new Set(imagePaths).size, 10);
  for (const imagePath of imagePaths) {
    assert.equal(fs.existsSync(path.join(root, imagePath)), true, imagePath);
  }
});

test('README pairs every visual preview with an explanation and groups Settings previews', () => {
  const readme = read('README.md');
  const rows = [...readme.matchAll(/<tr>[\s\S]*?<\/tr>/g)].map((match) => match[0]);
  const visualPaths = [
    ...[...readme.matchAll(/(?:src|href)="(docs\/images\/[^"?#]+\.(?:png|gif))"/g)].map((match) => match[1]),
    'assets/gold-companion-walking.gif',
  ];

  assert.match(readme, /class="screenshot-table"/);
  assert.equal((readme.match(/class="screenshot-explanation"/g) || []).length, 10);
  for (const visualPath of visualPaths) {
    const row = rows.find((candidate) => candidate.includes(`src="${visualPath}"`));
    assert.ok(row, `missing README row for ${visualPath}`);
    assert.match(row, /class="screenshot-explanation"/);
  }

  const settingsRow = rows.find((row) => row.includes('docs/images/settings.png'));
  assert.ok(settingsRow, 'missing Settings README row');
  assert.match(settingsRow, /docs\/images\/screenshot-scan-folders\.png/);
  assert.match(settingsRow, /General:/);
  assert.match(settingsRow, /Advanced scan:/);
});
