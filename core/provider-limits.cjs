const PUBLIC_LIMIT_SOURCES = Object.freeze({
  "openai-codex":
    "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan",
  anthropic:
    "https://support.claude.com/en/articles/11049741-what-is-the-max-plan",
  "google-gemini": "https://ai.google.dev/gemini-api/docs/rate-limits",
});
function normalizeLimitWindows(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const utilization = Number(item.utilization),
        kind =
          item.kind === "weekly"
            ? "weekly"
            : item.kind === "session"
              ? "session"
              : null;
      if (!Number.isFinite(utilization) || !kind) return null;
      return {
        key: String(item.key || `${kind}-${index}`),
        kind,
        utilization: Math.max(0, Math.min(100, utilization)),
        provider: String(item.provider || ""),
        resetAt: item.resetAt ? String(item.resetAt) : null,
      };
    })
    .filter(Boolean);
}
module.exports = { normalizeLimitWindows, PUBLIC_LIMIT_SOURCES };
