const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_SETTINGS, normalizeSettings, updateSetting } = require('../core/settings.cjs');

test('settings have safe defaults matching the original controls', () => {
  assert.equal(DEFAULT_SETTINGS.refreshMinutes, 1);
  assert.equal(DEFAULT_SETTINGS.menuTodayTokens, true);
  assert.equal(DEFAULT_SETTINGS.menuTodayCost, false);
  assert.equal(DEFAULT_SETTINGS.keychainOptOut, false);
});

test('settings normalize select and toggle values instead of accepting arbitrary input', () => {
  const settings = normalizeSettings({ refreshMinutes: 99, warningPercent: -2, limitDisplay: 'bad' });
  assert.equal(settings.refreshMinutes, 15);
  assert.equal(settings.warningPercent, 0);
  assert.equal(settings.limitDisplay, DEFAULT_SETTINGS.limitDisplay);
  assert.equal(updateSetting(settings, 'menuTodayCost', false).menuTodayCost, false);
  assert.equal(updateSetting(settings, 'refreshMinutes', 'manual').refreshMinutes, 0);
});
