const DEFAULT_SIZE = 96;
const LABEL_HEIGHT = 28;

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeSize(value) {
  const size = Math.round(finite(value, DEFAULT_SIZE));
  return Math.max(48, Math.min(256, size));
}

function createFloatingPetController({ window, savePosition = () => {} }) {
  if (!window) throw new TypeError("floating pet window is required");

  let contentSize = null;
  let lockedBounds = null;
  let drag = null;

  function setSize(value) {
    const size = normalizeSize(value);
    if (contentSize === size) return false;
    const height = size + LABEL_HEIGHT;

    // Resize is an explicit Settings operation. Temporarily clear the old
    // native bounds, apply the new content size, then lock the window again.
    window.setResizable?.(true);
    window.setMinimumSize?.(0, 0);
    window.setMaximumSize?.(10000, 10000);
    window.setContentSize(size, height);
    window.setMinimumSize?.(size, height);
    window.setMaximumSize?.(size, height);
    window.setResizable?.(false);

    contentSize = size;
    lockedBounds = { width: size, height };
    return true;
  }

  function beginDrag(screenX, screenY) {
    const [left, top] = window.getPosition();
    drag = {
      offsetX: finite(screenX) - finite(left),
      offsetY: finite(screenY) - finite(top),
    };
    return true;
  }

  function moveDrag(screenX, screenY) {
    if (!drag) return false;
    const x = Math.round(finite(screenX) - drag.offsetX);
    const y = Math.round(finite(screenY) - drag.offsetY);
    window.setPosition(x, y, false);
    const bounds = window.getBounds?.();
    if (
      bounds &&
      lockedBounds &&
      (Number(bounds.width) !== lockedBounds.width || Number(bounds.height) !== lockedBounds.height)
    ) {
      window.setBounds?.({ x, y, ...lockedBounds }, false);
    }
    return { x, y };
  }

  function endDrag(screenX, screenY) {
    if (!drag) return false;
    const position = moveDrag(screenX, screenY);
    drag = null;
    if (position) savePosition(position);
    return position;
  }

  function cancelDrag() {
    drag = null;
  }

  return {
    setSize,
    beginDrag,
    moveDrag,
    endDrag,
    cancelDrag,
    isDragging: () => Boolean(drag),
    contentSize: () => contentSize,
  };
}

module.exports = {
  createFloatingPetController,
  normalizeSize,
  LABEL_HEIGHT,
  DEFAULT_SIZE,
};
