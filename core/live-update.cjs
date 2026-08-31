function publishSnapshot(windowLike, snapshot) {
  if (!windowLike || windowLike.isDestroyed()) return false;
  windowLike.webContents.send("usage-updated", snapshot);
  return true;
}

module.exports = { publishSnapshot };
