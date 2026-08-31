const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('release metadata targets the private Windows repository and Ko-fi page', () => {
  const packageJson = JSON.parse(read('package.json'));
  const readme = read('README.md');
  const funding = read('.github/FUNDING.yml');

  assert.equal(packageJson.repository.url, 'https://github.com/MarkusSela/PokeTokenBarWindows-Lab.git');
  assert.equal(packageJson.homepage, 'https://github.com/MarkusSela/PokeTokenBarWindows-Lab');
  assert.equal(packageJson.private, undefined);
  assert.match(readme, /MarkusSela\/PokeTokenBarWindows-Lab/);
  assert.match(readme, /https:\/\/ko-fi\.com\/marukoshi/);
  assert.match(funding, /https:\/\/ko-fi\.com\/marukoshi/);
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
