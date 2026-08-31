const DEFAULT_SETTINGS = Object.freeze({
  language: "en",
  refreshMinutes: 1,
  limitDisplay: "used",
  launchAtLogin: false,
  menuTodayTokens: true,
  menuTodayCost: false,
  menuLimitPercent: true,
  showFloatingPet: false,
  floatingPetSize: 96,
  showGoldWalking: false,
  goldWalkingSize: 76,
  notificationsBubbles: true,
  updateNotifications: true,
  limitAlerts: true,
  warningPercent: 80,
  criticalPercent: 95,
  companionEvents: true,
  providerStatus: true,
  keychainOptOut: false,
  additionalScanFolders: [],
});
const SELECTS = {
  language: ["it", "en", "ko", "ja", "es", "fr", "pt"],
  refreshMinutes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  limitDisplay: ["used", "remaining"],
};
const TOGGLES = [
  "launchAtLogin",
  "menuTodayTokens",
  "menuTodayCost",
  "menuLimitPercent",
  "showFloatingPet",
  "showGoldWalking",
  "notificationsBubbles",
  "updateNotifications",
  "limitAlerts",
  "companionEvents",
  "providerStatus",
  "keychainOptOut",
];
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(min, Math.min(max, Math.round(n)))
    : fallback;
}
function normalizeSettings(input = {}) {
  const out = { ...DEFAULT_SETTINGS, ...input };
  if (out.refreshMinutes === "manual") out.refreshMinutes = 0;
  else if (Number.isFinite(Number(out.refreshMinutes)))
    out.refreshMinutes = clampInt(
      out.refreshMinutes,
      0,
      15,
      DEFAULT_SETTINGS.refreshMinutes,
    );
  else out.refreshMinutes = DEFAULT_SETTINGS.refreshMinutes;
  for (const key of ["language", "limitDisplay"])
    if (!SELECTS[key].includes(out[key])) out[key] = DEFAULT_SETTINGS[key];
  for (const key of TOGGLES) out[key] = Boolean(out[key]);
  out.warningPercent = clampInt(
    out.warningPercent,
    0,
    100,
    DEFAULT_SETTINGS.warningPercent,
  );
  out.criticalPercent = clampInt(
    out.criticalPercent,
    0,
    100,
    DEFAULT_SETTINGS.criticalPercent,
  );
  out.floatingPetSize = clampInt(
    out.floatingPetSize,
    48,
    256,
    DEFAULT_SETTINGS.floatingPetSize,
  );
  out.goldWalkingSize = clampInt(
    out.goldWalkingSize,
    24,
    128,
    DEFAULT_SETTINGS.goldWalkingSize,
  );
  out.additionalScanFolders = Array.isArray(out.additionalScanFolders)
    ? out.additionalScanFolders.filter((x) => typeof x === "string" && x.trim())
    : [];
  return out;
}
function updateSetting(settings, key, value) {
  return normalizeSettings({ ...settings, [key]: value });
}
module.exports = { DEFAULT_SETTINGS, normalizeSettings, updateSetting };
