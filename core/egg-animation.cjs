const BASE_PULSE = { mode: 'pulse', intervalMs: 300_000 };
const PULSE_INTERVALS = [
  { minimum: 0.60, intervalMs: 60_000 },
  { minimum: 0.30, intervalMs: 180_000 },
];

function eggAnimationPlan(surface, progress) {
  const value = Math.max(0, Math.min(1, Number(progress) || 0));
  if (surface !== 'home') return { mode: 'static', intervalMs: null };
  if (value < 0.15) return BASE_PULSE;
  if (value < 0.30) return BASE_PULSE;
  if (value >= 0.90) return { mode: 'continuous', intervalMs: 0 };
  const stage = PULSE_INTERVALS.find((item) => value >= item.minimum);
  return { mode: 'pulse', intervalMs: stage?.intervalMs ?? BASE_PULSE.intervalMs };
}

function shouldStartEggPulse({ openedAt, now, lastPulseAt, plan }) {
  if (!plan || plan.mode !== 'pulse' || plan.intervalMs == null) return false;
  const start = Number(openedAt);
  const current = Number(now);
  const last = Number(lastPulseAt);
  if (![start, current, last].every(Number.isFinite)) return false;
  return current - Math.max(start, last) >= plan.intervalMs;
}

module.exports = { eggAnimationPlan, shouldStartEggPulse };
