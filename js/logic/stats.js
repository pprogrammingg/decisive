export const MAX_STATS = 5;
export const STATS_PAIRS = 10;
export const STATS_NAME_MAX = 10;

export function defaultStats() {
  return { items: [] };
}

export function emptyPairs() {
  return Array.from({ length: STATS_PAIRS }, () => ({ key: "", value: "" }));
}

export function compactPairs(pairs) {
  return (pairs || [])
    .map((p) => ({
      key: String(p && p.key != null ? p.key : "").trim(),
      value: String(p && p.value != null ? p.value : "")
    }))
    .filter((p) => p.key !== "")
    .slice(0, STATS_PAIRS);
}

export function padPairs(pairs) {
  const a = compactPairs(pairs);
  while (a.length < STATS_PAIRS) a.push({ key: "", value: "" });
  return a;
}

export function statsLabel(index) {
  return "stats" + (index + 1);
}

/** Trim and cap at 10 characters. Empty string means “use statsN”. */
export function clampStatsName(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, STATS_NAME_MAX);
}

export function statsDisplayName(item, index) {
  const n = clampStatsName(item && item.name);
  return n || statsLabel(index);
}

export function canAddStats(items) {
  return (items || []).length < MAX_STATS;
}

export function newStatsItem() {
  return {
    id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: "",
    pairs: emptyPairs()
  };
}

export function addStatsItem(items) {
  const list = items || [];
  if (!canAddStats(list)) return list.slice();
  return list.concat(newStatsItem());
}

export function removeStatsItem(items, id) {
  return (items || []).filter((x) => x.id !== id);
}

export function renameStatsItem(items, id, name) {
  const n = clampStatsName(name);
  return (items || []).map((x) => x.id === id ? { ...x, name: n } : x);
}

export function ensureStatsItem(raw) {
  if (!raw || typeof raw !== "object") return newStatsItem();
  return {
    id: String(raw.id || newStatsItem().id),
    name: clampStatsName(raw.name),
    pairs: padPairs(raw.pairs)
  };
}

export function ensureStats(raw) {
  const items = raw && Array.isArray(raw.items)
    ? raw.items.map(ensureStatsItem).slice(0, MAX_STATS)
    : [];
  return { items };
}
