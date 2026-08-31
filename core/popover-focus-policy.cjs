function inside(point, bounds) {
  if (!point || !bounds) return false;
  return (
    point.x >= bounds.x &&
    point.y >= bounds.y &&
    point.x < bounds.x + bounds.width &&
    point.y < bounds.y + bounds.height
  );
}

function shouldHidePopoverOnBlur({
  quitting = false,
  focused = false,
  cursor,
  bounds,
} = {}) {
  if (quitting || focused) return false;
  return !inside(cursor, bounds);
}

module.exports = { inside, shouldHidePopoverOnBlur };
