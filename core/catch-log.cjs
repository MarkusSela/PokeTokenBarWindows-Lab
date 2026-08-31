function normalizeEntry(entry, kind = 'graduated') {
  if (!entry || typeof entry !== 'object') return null;
  const chainOrder = Array.isArray(entry.chainOrder) ? [...entry.chainOrder] : [];
  if (!chainOrder.length) return null;
  return {
    ...entry,
    id: String(entry.id || `${kind}-${entry.baseId ?? chainOrder[0]}-${entry.finalId ?? chainOrder.at(-1)}`),
    kind,
    chainOrder,
  };
}

function buildCatchLogEntries({ active = null, dex = [] } = {}) {
  const activeEntry = active
    ? normalizeEntry({
        id: `active-${active.baseId}-${active.pathIds?.join('-') || active.stageIndex || 0}`,
        baseId: active.baseId,
        finalId: active.pathIds?.at(-1),
        chainOrder: active.pathIds,
        stageIndex: active.stageIndex,
        nature: active.nature,
        rarity: active.rarity,
        shiny: active.shinyVisible ?? active.shiny,
        caughtAt: null,
        names: active.names,
      }, 'active')
    : null;
  const graduated = (Array.isArray(dex) ? dex : [])
    .map((entry) => normalizeEntry(entry, 'graduated'))
    .filter(Boolean)
    .sort((a, b) => {
      const left = a.caughtAt ? Date.parse(a.caughtAt) : -Infinity;
      const right = b.caughtAt ? Date.parse(b.caughtAt) : -Infinity;
      return right - left;
    });
  return activeEntry ? [activeEntry, ...graduated] : graduated;
}

module.exports = { buildCatchLogEntries, normalizeEntry };
