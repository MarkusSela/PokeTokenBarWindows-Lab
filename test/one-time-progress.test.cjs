const test = require('node:test');
const assert = require('node:assert/strict');
const { Game } = require('../core/game.cjs');

test('one-time manual progress grant advances only the active companion and cannot repeat', () => {
  const game = new Game({ state: { active: { baseId: 543, pathIds: [543, 544, 545], plannedPathIds: [543, 544, 545], stageIndex: 0, usedAtStage: 10, rarity: 'common', totalForms: 3, shiny: false, nature: 'Gentle', names: { 543: 'Venipede' } }, usedSinceInstall: 100, spentTokens: 0 } });
  assert.equal(game.grantOneTimeProgress('venipede-100m', 100_000_000), true);
  assert.equal(game.state.active.usedAtStage, 100_000_010);
  assert.equal(game.grantOneTimeProgress('venipede-100m', 100_000_000), false);
  assert.equal(game.state.active.usedAtStage, 100_000_010);
  assert.equal(game.state.usedSinceInstall, 100);
});
