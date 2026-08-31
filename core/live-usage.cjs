const METRICS = [
  'tokens',
  'cost',
  'input',
  'output',
  'cacheRead',
  'cacheWrite',
  'reasoning',
];

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function blankStats() {
  return Object.fromEntries(METRICS.map((metric) => [metric, 0]));
}

function normalizeStats(value) {
  return Object.fromEntries(METRICS.map((metric) => [metric, finite(value?.[metric])]));
}

function validCorrection(value) {
  const stats = normalizeStats(value);
  const componentTotal =
    stats.input + stats.output + stats.cacheRead + stats.cacheWrite + stats.reasoning;
  return stats.tokens === componentTotal ? stats : blankStats();
}

function completeRawSnapshot(value) {
  if (!value || typeof value !== 'object') return false;
  return ['today', 'week', 'month'].every((window) =>
    normalizeStats(value[window]).tokens ===
      normalizeStats(value[window]).input +
      normalizeStats(value[window]).output +
      normalizeStats(value[window]).cacheRead +
      normalizeStats(value[window]).cacheWrite +
      normalizeStats(value[window]).reasoning,
  ) && (value.todayProviders || []).every((provider) => {
    const stats = normalizeStats(provider);
    return stats.tokens ===
      stats.input + stats.output + stats.cacheRead + stats.cacheWrite + stats.reasoning;
  });
}

function hasPositiveStats(stats) {
  return METRICS.some((metric) => stats[metric] > 0);
}

function providerStats(providers = []) {
  return new Map(
    (Array.isArray(providers) ? providers : []).map((provider) => [
      String(provider?.name || ''),
      normalizeStats(provider),
    ]),
  );
}

function mergeProviderExtras(providers, extras) {
  const merged = new Map(
    (Array.isArray(providers) ? providers : []).map((provider) => [
      String(provider?.name || ''),
      { ...provider },
    ]),
  );
  for (const [name, extra] of extras) {
    if (!name || !hasPositiveStats(extra)) continue;
    const current = merged.get(name) || { name };
    const stats = normalizeStats(current);
    for (const metric of METRICS) stats[metric] += extra[metric];
    merged.set(name, { ...current, ...stats });
  }
  return [...merged.values()].sort((left, right) => finite(right.tokens) - finite(left.tokens));
}

class LiveUsageDisplay {
  constructor(savedState = {}) {
    this.date = null;
    this.previousRaw = null;
    this.extraByWindow = { today: blankStats(), week: blankStats(), month: blankStats() };
    this.extraByProvider = new Map();
    if (savedState && typeof savedState === 'object') {
      this.date = savedState.date ? String(savedState.date) : null;
      this.previousRaw = savedState.previousRaw || null;
      for (const window of Object.keys(this.extraByWindow)) {
        const saved = savedState.extraByWindow?.[window];
        this.extraByWindow[window] =
          typeof saved === 'number'
            ? blankStats()
            : validCorrection(saved);
      }
      this.extraByProvider = new Map(
        Object.entries(savedState.extraByProvider || {}).map(([name, value]) => [
          name,
          typeof value === 'number'
            ? blankStats()
            : validCorrection(value),
        ]),
      );
      if (!completeRawSnapshot(this.previousRaw)) {
        this.previousRaw = null;
        this.extraByWindow = { today: blankStats(), week: blankStats(), month: blankStats() };
        this.extraByProvider = new Map();
      }
    }
  }

  reset(date) {
    this.date = date;
    this.previousRaw = null;
    this.extraByWindow = { today: blankStats(), week: blankStats(), month: blankStats() };
    this.extraByProvider = new Map();
  }

  apply(rawUsage, delta = {}) {
    const usage = rawUsage || {};
    const date = String(usage.date || '');
    if (date !== this.date) this.reset(date);

    const deltaStats = normalizeStats(delta);
    for (const window of Object.keys(this.extraByWindow)) {
      const current = normalizeStats(usage[window]);
      const previous = normalizeStats(this.previousRaw?.[window]);
      for (const metric of METRICS) {
        const rawDelta = Math.max(0, current[metric] - previous[metric]);
        this.extraByWindow[window][metric] += Math.max(0, deltaStats[metric] - rawDelta);
      }
    }

    const previousProviders = providerStats(this.previousRaw?.todayProviders);
    const currentProviders = providerStats(usage.todayProviders);
    const deltaByProvider = providerStats(delta.byProvider);
    for (const [name, providerDelta] of deltaByProvider) {
      const current = currentProviders.get(name) || blankStats();
      const previous = previousProviders.get(name) || blankStats();
      const extra = blankStats();
      for (const metric of METRICS) {
        const rawDelta = Math.max(0, current[metric] - previous[metric]);
        extra[metric] = Math.max(0, providerDelta[metric] - rawDelta);
      }
      const accumulated = this.extraByProvider.get(name) || blankStats();
      for (const metric of METRICS) accumulated[metric] += extra[metric];
      this.extraByProvider.set(name, accumulated);
    }

    const adjustedProviders = mergeProviderExtras(usage.todayProviders, this.extraByProvider);
    const adjustedToday = {
      ...(usage.today || {}),
      ...this.adjustWindow(usage.today, this.extraByWindow.today),
    };
    if (adjustedProviders.length) {
      const providerTotals = blankStats();
      for (const provider of adjustedProviders) {
        const stats = normalizeStats(provider);
        for (const metric of METRICS) providerTotals[metric] += stats[metric];
      }
      for (const metric of METRICS) adjustedToday[metric] = providerTotals[metric];
    }
    const adjusted = {
      ...usage,
      today: adjustedToday,
      week: { ...(usage.week || {}), ...this.adjustWindow(usage.week, this.extraByWindow.week) },
      month: { ...(usage.month || {}), ...this.adjustWindow(usage.month, this.extraByWindow.month) },
      todayProviders: adjustedProviders,
    };
    this.previousRaw = usage;
    return adjusted;
  }

  adjustWindow(window, extra) {
    const adjusted = {};
    for (const metric of METRICS)
      adjusted[metric] = finite(window?.[metric]) + extra[metric];
    return adjusted;
  }

  exportState() {
    const compactWindow = (window) => normalizeStats(window);
    return {
      date: this.date,
      previousRaw: this.previousRaw
        ? {
            today: compactWindow(this.previousRaw.today),
            week: compactWindow(this.previousRaw.week),
            month: compactWindow(this.previousRaw.month),
            todayProviders: (this.previousRaw.todayProviders || []).map((provider) => ({
              name: String(provider?.name || ''),
              ...normalizeStats(provider),
            })),
          }
        : null,
      extraByWindow: Object.fromEntries(
        Object.entries(this.extraByWindow).map(([window, stats]) => [window, compactWindow(stats)]),
      ),
      extraByProvider: Object.fromEntries(this.extraByProvider),
    };
  }
}

module.exports = { LiveUsageDisplay, METRICS };
