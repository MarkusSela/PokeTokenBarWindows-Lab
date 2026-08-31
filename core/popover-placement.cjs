function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

function placePopoverBounds(trayBounds, workArea, width, height, margin = 8) {
  const maximumX = workArea.x + workArea.width - width - margin;
  const maximumY = workArea.y + workArea.height - height - margin;
  const centeredX =
    trayBounds.x + Math.round(trayBounds.width / 2) - Math.round(width / 2);
  const isTrayAtBottom =
    trayBounds.y >= workArea.y + workArea.height - trayBounds.height;
  const requestedY = isTrayAtBottom
    ? workArea.y + workArea.height - height - margin
    : trayBounds.y + trayBounds.height + margin;

  return {
    x: Math.round(clamp(centeredX, workArea.x + margin, maximumX)),
    y: Math.round(clamp(requestedY, workArea.y + margin, maximumY)),
    width,
    height,
  };
}

module.exports = { placePopoverBounds };
