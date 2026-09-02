export const MAX_SUB = 5;
export const TIME_NAME_MAX = 10;
export const LAP_COLS = 3;
export const LAP_ROWS = 10;
export const MAX_LAPS = LAP_COLS * LAP_ROWS;

export function defaultTime() {
  return { items: [] };
}

export function clampTimeName(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, TIME_NAME_MAX);
}

export function timeFallbackLabel(item, index) {
  const kind = item && item.type === "stopwatch" ? "Stopwatch" : "Timer";
  return kind + " " + (index + 1);
}

export function timeDisplayName(item, index) {
  const n = clampTimeName(item && item.name);
  return n || timeFallbackLabel(item, index);
}

export function renameTimeItem(items, id, name) {
  const n = clampTimeName(name);
  return (items || []).map((x) => (x.id === id ? { ...x, name: n } : x));
}

export function newTimeItem(type) {
  const t = type === "stopwatch" ? "stopwatch" : "timer";
  return {
    id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: t,
    name: "",
    running: false,
    runStartedAt: null,
    durationMs: t === "timer" ? 60000 : 0,
    remainingMs: t === "timer" ? 60000 : 0,
    elapsedMs: 0,
    laps: []
  };
}

export function canAddTimeItem(items) {
  return (items || []).length < MAX_SUB;
}

export function addTimeItem(items, type) {
  const list = items || [];
  if (!canAddTimeItem(list)) return list.slice();
  return list.concat(newTimeItem(type));
}

export function removeTimeItem(items, id) {
  return (items || []).filter((x) => x.id !== id);
}

export function foldRunning(item, now = Date.now()) {
  if (!item.running || item.runStartedAt == null) {
    return { ...item, running: false, runStartedAt: null };
  }
  const dt = Math.max(0, now - item.runStartedAt);
  if (item.type === "timer") {
    const remainingMs = Math.max(0, (item.remainingMs || 0) - dt);
    return { ...item, remainingMs, running: false, runStartedAt: null };
  }
  return {
    ...item,
    elapsedMs: (item.elapsedMs || 0) + dt,
    running: false,
    runStartedAt: null
  };
}

export function displayTimerMs(item, now = Date.now()) {
  if (!item.running || item.runStartedAt == null) return Math.max(0, item.remainingMs || 0);
  return Math.max(0, (item.remainingMs || 0) - (now - item.runStartedAt));
}

export function displayStopwatchMs(item, now = Date.now()) {
  if (!item.running || item.runStartedAt == null) return item.elapsedMs || 0;
  return (item.elapsedMs || 0) + (now - item.runStartedAt);
}

export function startItem(item, now = Date.now()) {
  if (item.running) return item;
  if (item.type === "timer" && (item.remainingMs || 0) <= 0) {
    return { ...item, remainingMs: item.durationMs || 0, running: true, runStartedAt: now };
  }
  return { ...item, running: true, runStartedAt: now };
}

export function pauseItem(item, now = Date.now()) {
  return foldRunning(item, now);
}

export function resetItem(item) {
  if (item.type === "timer") {
    const d = item.durationMs || 0;
    return { ...item, running: false, runStartedAt: null, remainingMs: d, elapsedMs: 0 };
  }
  return { ...item, running: false, runStartedAt: null, elapsedMs: 0, laps: [] };
}

export function addMinute(item, now = Date.now()) {
  const folded = item.running ? foldRunning(item, now) : { ...item };
  const remainingMs = (folded.remainingMs || 0) + 60000;
  const durationMs = Math.max(folded.durationMs || 0, remainingMs);
  const next = { ...folded, remainingMs, durationMs };
  return item.running ? startItem(next, now) : next;
}

export function setTimerDuration(item, durationMs) {
  const d = Math.max(0, durationMs | 0);
  return {
    ...item,
    durationMs: d,
    remainingMs: d,
    running: false,
    runStartedAt: null
  };
}

export function addLap(item, now = Date.now()) {
  if (item.type !== "stopwatch") return item;
  const laps = item.laps || [];
  if (laps.length >= MAX_LAPS) return item;
  const elapsed = displayStopwatchMs(item, now);
  return { ...item, laps: laps.concat(elapsed) };
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatTimer(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return h + ":" + pad2(m) + ":" + pad2(s);
  return pad2(m) + ":" + pad2(s);
}

export function formatStopwatch(ms) {
  const t = Math.max(0, ms | 0);
  const cs = Math.floor((t % 1000) / 10);
  const totalS = Math.floor(t / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return pad2(m) + ":" + pad2(s) + "." + pad2(cs);
}

export function hmsToMs(h, m, s) {
  const hh = Math.max(0, h | 0);
  const mm = Math.min(59, Math.max(0, m | 0));
  const ss = Math.min(59, Math.max(0, s | 0));
  return ((hh * 3600) + (mm * 60) + ss) * 1000;
}

export function msToHms(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(t / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60
  };
}

export function ensureTimeItem(raw) {
  if (!raw || typeof raw !== "object") return newTimeItem("timer");
  const type = raw.type === "stopwatch" ? "stopwatch" : "timer";
  const durationMs = Math.max(0, Number(raw.durationMs) || 0);
  const remainingMs = Math.max(0, Number(raw.remainingMs) || 0);
  const elapsedMs = Math.max(0, Number(raw.elapsedMs) || 0);
  const laps = Array.isArray(raw.laps)
    ? raw.laps.map((n) => Math.max(0, Number(n) || 0)).slice(0, MAX_LAPS)
    : [];
  return {
    id: String(raw.id || newTimeItem(type).id),
    type,
    name: clampTimeName(raw.name),
    running: !!raw.running,
    runStartedAt: raw.runStartedAt == null ? null : Number(raw.runStartedAt) || null,
    durationMs: type === "timer" ? (durationMs || remainingMs) : 0,
    remainingMs: type === "timer" ? remainingMs : 0,
    elapsedMs: type === "stopwatch" ? elapsedMs : 0,
    laps: type === "stopwatch" ? laps : []
  };
}

export function ensureTime(raw) {
  const items = raw && Array.isArray(raw.items) ? raw.items.map(ensureTimeItem).slice(0, MAX_SUB) : [];
  return { items };
}
