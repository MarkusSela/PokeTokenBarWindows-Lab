const fs = require('node:fs');
const path = require('node:path');
const BASE = 'https://pokeapi.co/api/v2';
const headers = { 'user-agent': 'PokeTokenBar/0.1.0 catalog builder' };
async function get(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}
function idOf(url) { return Number(String(url).split('/').filter(Boolean).at(-1)); }
function flatten(node) {
  const id = idOf(node.species.url);
  if (!node.evolves_to?.length) return [[id]];
  return node.evolves_to.flatMap(child => flatten(child).map(pathIds => [id, ...pathIds]));
}
function rarity(species) {
  if (species.is_legendary || species.is_mythical) return 'legendary';
  if (species.capture_rate <= 45) return 'rare';
  if (species.capture_rate <= 120) return 'uncommon';
  return 'common';
}
async function mapLimit(values, limit, fn) {
  const out = new Array(values.length); let next = 0;
  async function worker() { while (true) { const i = next++; if (i >= values.length) return; out[i] = await fn(values[i], i); } }
  await Promise.all(Array.from({ length: limit }, worker)); return out;
}
(async () => {
  const chains = (await get(`${BASE}/evolution-chain?limit=1000`)).results;
  const relevant = [];
  for (const item of chains) {
    const chain = await get(item.url);
    const rootId = idOf(chain.chain.species.url);
    if (rootId >= 1 && rootId <= 649 && rootId !== 132) relevant.push({ rootId, chain: chain.chain });
  }
  const rows = await mapLimit(relevant, 20, async ({ rootId, chain }) => {
    const pathOptions = flatten(chain).map(p => p.filter(id => id >= 1 && id <= 649));
    const ids = [...new Set(pathOptions.flat())];
    const species = await mapLimit(ids, 20, id => get(`${BASE}/pokemon-species/${id}`));
    const byId = new Map(species.map(row => [row.id, row]));
    const root = byId.get(rootId) || await get(`${BASE}/pokemon-species/${rootId}`);
    const names = {};
    for (const row of species) {
      const translated = Object.fromEntries(row.names.filter(x => ['en', 'it'].includes(x.language.name)).map(x => [x.language.name, x.name]));
      if (!translated.en) translated.en = `#${row.id}`;
      if (!translated.it) translated.it = translated.en;
      names[row.id] = translated;
    }
    return { id: rootId, captureRate: root.capture_rate, rarity: rarity(root), line: { baseId: rootId, pathOptions, pathIds: pathOptions[0], rarity: rarity(root), names, captureRate: root.capture_rate } };
  });
  rows.sort((a, b) => a.id - b.id);
  const destination = path.join(__dirname, '..', 'assets', 'pokemon-catalog-gen1-5.json');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(rows));
  console.log(JSON.stringify({ destination, roots: rows.length, first: rows[0], last: rows.at(-1), bytes: fs.statSync(destination).size }));
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
