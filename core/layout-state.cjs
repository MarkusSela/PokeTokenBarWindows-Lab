function resetAfterExternalDismiss(state, interaction = { external: true }) {
  if (interaction?.external === false) return state;
  return { tab: 'home', settingsOpen: false, scrollTop: 0 };
}

function sectionViewport(height = 600) {
  const value = Math.max(1, Math.round(Number(height) || 600));
  return { minHeight: value, height: value, overflow: 'hidden' };
}

module.exports = { resetAfterExternalDismiss, sectionViewport };
