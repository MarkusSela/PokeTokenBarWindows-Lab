const fs = require('node:fs');
const path = require('node:path');
const { loadState, saveState } = require('../core/state-store.cjs');

const SEED_KEY = 'lab-seed-10-billion-v1';
const EXTRA_TOKENS = 10_000_000_000;
const SEED_50B_KEY = 'lab-seed-50-billion-v2';
const EXTRA_TOKENS_50B = 50_000_000_000;
const SEED_999_CANDY_KEY = 'lab-seed-999-rare-candy-v1';
const EXTRA_RARE_CANDY = 999;
const ITEM_GRANTS = Object.freeze({ mint: 7, rareCandy: 13 });

function seedLabState(file) {
  const state = loadState(file) || {};
  state.oneTimeGrants = { ...(state.oneTimeGrants || {}) };
  state.inventory = { ...(state.inventory || {}) };
  if (!state.oneTimeGrants[SEED_KEY]) {
    state.usedSinceInstall = Math.max(0, Number(state.usedSinceInstall) || 0) + EXTRA_TOKENS;
    for (const [kind, count] of Object.entries(ITEM_GRANTS))
      state.inventory[kind] = Math.max(0, Number(state.inventory[kind]) || 0) + count;
    state.oneTimeGrants[SEED_KEY] = true;
    saveState(file, state);
  }
  return state;
}

function addTestTokens(file) {
  const state = loadState(file) || {};
  state.oneTimeGrants = { ...(state.oneTimeGrants || {}) };
  state.inventory = { ...(state.inventory || {}) };
  if (!state.oneTimeGrants[SEED_50B_KEY]) {
    state.usedSinceInstall = Math.max(0, Number(state.usedSinceInstall) || 0) + EXTRA_TOKENS_50B;
    state.oneTimeGrants[SEED_50B_KEY] = true;
  }
  if (!state.oneTimeGrants[SEED_999_CANDY_KEY]) {
    state.inventory.rareCandy = Math.max(0, Number(state.inventory.rareCandy) || 0) + EXTRA_RARE_CANDY;
    state.oneTimeGrants[SEED_999_CANDY_KEY] = true;
  }
  saveState(file, state);
  return state;
}

function defaultLabStateFile() {
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
  return path.join(appData, 'PokeTokenBarWindows-Lab', 'companion-state.json');
}

if (require.main === module) {
  const large = process.argv.includes('--50b');
  const file = process.argv.slice(2).find((argument) => argument !== '--50b') || defaultLabStateFile();
  const state = large ? addTestTokens(file) : seedLabState(file);
  process.stdout.write(JSON.stringify({ file, usedSinceInstall: state.usedSinceInstall, inventory: state.inventory }) + '\n');
}

module.exports = {
  seedLabState,
  addTestTokens,
  defaultLabStateFile,
  EXTRA_TOKENS,
  EXTRA_TOKENS_50B,
  EXTRA_RARE_CANDY,
  ITEM_GRANTS,
  SEED_KEY,
  SEED_50B_KEY,
  SEED_999_CANDY_KEY,
};
