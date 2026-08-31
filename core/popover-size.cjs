const MIN_POPOVER_HEIGHT = 220;

function clampPopoverHeight(requestedHeight, workAreaHeight, minimum = MIN_POPOVER_HEIGHT) {
  const area = Math.max(minimum, Math.ceil(Number(workAreaHeight) || minimum));
  const requested = Math.ceil(Number(requestedHeight) || minimum);
  return Math.max(minimum, Math.min(area, requested));
}

module.exports = { MIN_POPOVER_HEIGHT, clampPopoverHeight };
