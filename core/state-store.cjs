const fs = require("fs");
const path = require("path");
function loadState(file) {
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}
function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const pending = `${file}.tmp`;
  fs.writeFileSync(pending, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(pending, file);
}
module.exports = { loadState, saveState };
