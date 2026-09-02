export const PALETTE = [
  "#FF6F61",
  "#8B9BFF",
  "#E11D8F",
  "#F7F1E8",
  "#12121A",
  "#2DD4BF",
] as const;

export const WIDGET_IDS = ["color", "chime", "time", "stats"] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

export const WIDGET_META: Record<
  WidgetId,
  { title: string; blurb: string; icon: string }
> = {
  color: { title: "Color change", blurb: "Full-screen colour drills", icon: "◐" },
  chime: { title: "Interval chime", blurb: "Sound on a fixed or random beat", icon: "music-note" },
  time: { title: "Time", blurb: "Timers and stopwatches", icon: "⏱" },
  stats: { title: "Stats", blurb: "Ten key / value field notes", icon: "▦" },
};

export const MAX_WIDGETS = 4;
export const MAX_SUB = 5;
export const TIME_NAME_MAX = 15;
export const LAP_COLS = 3;
export const LAP_ROWS = 10;
export const MAX_LAPS = LAP_COLS * LAP_ROWS;
export const MAX_STATS = 5;
export const STATS_PAIRS = 10;
export const STATS_NAME_MAX = 10;
export const CHIME_MIN = 1;
export const CHIME_MAX = 900;

export type ColorState = { count: number; delayLo: string; delayHi: string };
export type ChimeState = { mode: "fixed" | "random"; fixed: number; lo: number; hi: number };
export type TimeItem = {
  id: string;
  type: "timer" | "stopwatch";
  name: string;
  running: boolean;
  runStartedAt: number | null;
  durationMs: number;
  remainingMs: number;
  elapsedMs: number;
  laps: number[];
};
export type StatsItem = { id: string; name: string; pairs: { key: string; value: string }[] };
export type AppState = {
  layout: { order: WidgetId[] };
  color: ColorState;
  chime: ChimeState;
  time: { items: TimeItem[] };
  stats: { items: StatsItem[] };
};

export function clampColorCount(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 2;
  return Math.min(6, Math.max(2, x | 0));
}

export function parseNum(s: unknown): number | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const x = +t;
  return Number.isFinite(x) ? x : null;
}

export function colorDelayBounds(loStr: unknown, hiStr: unknown): { L: number; U: number } {
  const pl = parseNum(loStr);
  const ph = parseNum(hiStr);
  let x: number;
  let y: number;
  if (pl === null && ph === null) {
    x = 3;
    y = 1;
  } else if (pl === null && ph !== null) {
    x = 0.5;
    y = Math.min(5, Math.max(0.5, ph));
  } else if (pl !== null && ph === null) {
    x = Math.min(5, Math.max(0.5, pl));
    y = 5;
  } else {
    x = Math.min(5, Math.max(0.5, pl as number));
    y = Math.min(5, Math.max(0.5, ph as number));
  }
  if (x > y) [x, y] = [y, x];
  return { L: x, U: y };
}

export function nextColorDelayMs(color: ColorState, random = Math.random): number {
  const z = colorDelayBounds(color.delayLo, color.delayHi);
  return ((z.L + random() * (z.U - z.L)) * 1e3) | 0;
}

export function paletteForCount(count: number): string[] {
  return PALETTE.slice(0, clampColorCount(count)) as unknown as string[];
}

export function clampChimeSec(n: unknown, fallback = CHIME_MIN): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(CHIME_MAX, Math.max(CHIME_MIN, Math.round(x)));
}

export function nextChimeDelaySec(chime: ChimeState, random = Math.random): number {
  if (chime.mode === "fixed") return clampChimeSec(chime.fixed, 30);
  const lo = clampChimeSec(chime.lo, 5);
  const hi = clampChimeSec(chime.hi, 10);
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  return a + random() * (b - a);
}

export function formatChimeEta(leftMs: number, paused: boolean): string {
  const sec = Math.max(0, Math.ceil(leftMs / 1000));
  return (paused ? "paused  " : "next  ") + sec + "s";
}

export function uniqueOrder(order: unknown): WidgetId[] {
  const seen = new Set<string>();
  const out: WidgetId[] = [];
  for (const id of (order as string[]) || []) {
    if (!(WIDGET_IDS as readonly string[]).includes(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id as WidgetId);
    if (out.length >= MAX_WIDGETS) break;
  }
  return out;
}

export function canAdd(order: WidgetId[], id: WidgetId): boolean {
  return !order.includes(id) && order.length < MAX_WIDGETS;
}

export function addWidgets(order: WidgetId[], ids: WidgetId[]): WidgetId[] {
  let o = uniqueOrder(order);
  for (const id of ids) {
    if (canAdd(o, id)) o = o.concat(id);
  }
  return o;
}

export function removeWidget(order: WidgetId[], id: WidgetId): WidgetId[] {
  return uniqueOrder(order).filter((x) => x !== id);
}

export function swapWidgets(order: WidgetId[], a: WidgetId, b: WidgetId): WidgetId[] {
  const o = uniqueOrder(order);
  const i = o.indexOf(a);
  const j = o.indexOf(b);
  if (i < 0 || j < 0 || i === j) return o;
  const next = o.slice();
  next[i] = o[j];
  next[j] = o[i];
  return next;
}

export function togglePending(order: WidgetId[], pending: WidgetId[], id: WidgetId): WidgetId[] {
  const o = uniqueOrder(order);
  const p = pending.filter((x) => !o.includes(x));
  if (o.includes(id)) return p;
  if (p.includes(id)) return p.filter((x) => x !== id);
  if (o.length + p.length >= MAX_WIDGETS) return p;
  return p.concat(id);
}

export function commitPicker(order: WidgetId[], pending: WidgetId[]): WidgetId[] {
  return addWidgets(order, pending);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatTimer(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return h + ":" + pad2(m) + ":" + pad2(s);
  return pad2(m) + ":" + pad2(s);
}

export function formatStopwatch(ms: number): string {
  const t = Math.max(0, ms | 0);
  const cs = Math.floor((t % 1000) / 10);
  const totalS = Math.floor(t / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return pad2(m) + ":" + pad2(s) + "." + pad2(cs);
}

export function displayTimerMs(item: TimeItem, now = Date.now()): number {
  if (!item.running || item.runStartedAt == null) return Math.max(0, item.remainingMs || 0);
  return Math.max(0, (item.remainingMs || 0) - (now - item.runStartedAt));
}

export function displayStopwatchMs(item: TimeItem, now = Date.now()): number {
  if (!item.running || item.runStartedAt == null) return item.elapsedMs || 0;
  return (item.elapsedMs || 0) + (now - item.runStartedAt);
}

export function foldRunning(item: TimeItem, now = Date.now()): TimeItem {
  if (!item.running || item.runStartedAt == null) {
    return { ...item, running: false, runStartedAt: null };
  }
  const dt = Math.max(0, now - item.runStartedAt);
  if (item.type === "timer") {
    return { ...item, remainingMs: Math.max(0, (item.remainingMs || 0) - dt), running: false, runStartedAt: null };
  }
  return { ...item, elapsedMs: (item.elapsedMs || 0) + dt, running: false, runStartedAt: null };
}

export function startItem(item: TimeItem, now = Date.now()): TimeItem {
  if (item.running) return item;
  if (item.type === "timer" && (item.remainingMs || 0) <= 0) {
    return { ...item, remainingMs: item.durationMs || 0, running: true, runStartedAt: now };
  }
  return { ...item, running: true, runStartedAt: now };
}

export function pauseItem(item: TimeItem, now = Date.now()): TimeItem {
  return foldRunning(item, now);
}

export function resetItem(item: TimeItem): TimeItem {
  if (item.type === "timer") {
    const d = item.durationMs || 0;
    return { ...item, running: false, runStartedAt: null, remainingMs: d, elapsedMs: 0 };
  }
  return { ...item, running: false, runStartedAt: null, elapsedMs: 0, laps: [] };
}

export function addMinute(item: TimeItem, now = Date.now()): TimeItem {
  const folded = item.running ? foldRunning(item, now) : { ...item };
  const remainingMs = (folded.remainingMs || 0) + 60000;
  const durationMs = Math.max(folded.durationMs || 0, remainingMs);
  const next = { ...folded, remainingMs, durationMs };
  return item.running ? startItem(next, now) : next;
}

export function addLap(item: TimeItem, now = Date.now()): TimeItem {
  if (item.type !== "stopwatch") return item;
  const laps = item.laps || [];
  if (laps.length >= MAX_LAPS) return item;
  return { ...item, laps: laps.concat(displayStopwatchMs(item, now)) };
}

export function clampTimeName(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, TIME_NAME_MAX);
}

export function timeFallbackLabel(item: { type?: string } | null | undefined, index: number): string {
  const kind = item && item.type === "stopwatch" ? "Stopwatch" : "Timer";
  return kind + " " + (index + 1);
}

export function timeDisplayName(item: { name?: string; type?: string } | null | undefined, index: number): string {
  const n = clampTimeName(item && item.name);
  return n || timeFallbackLabel(item, index);
}

export function renameTimeItem(items: TimeItem[], id: string, name: string): TimeItem[] {
  const n = clampTimeName(name);
  return (items || []).map((x) => (x.id === id ? { ...x, name: n } : x));
}

export function hmsToMs(h: number, m: number, s: number): number {
  return ((Math.max(0, h | 0) * 3600) + (Math.min(59, Math.max(0, m | 0)) * 60) + Math.min(59, Math.max(0, s | 0))) * 1000;
}

export function compactPairs(pairs: { key: string; value: string }[]): { key: string; value: string }[] {
  return (pairs || [])
    .map((p) => ({ key: String(p?.key ?? "").trim(), value: String(p?.value ?? "") }))
    .filter((p) => p.key !== "")
    .slice(0, STATS_PAIRS);
}

export function padPairs(pairs: { key: string; value: string }[]): { key: string; value: string }[] {
  const a = compactPairs(pairs);
  while (a.length < STATS_PAIRS) a.push({ key: "", value: "" });
  return a;
}

export function statsLabel(index: number): string {
  return "stats" + (index + 1);
}

export function clampStatsName(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, STATS_NAME_MAX);
}

export function statsDisplayName(item: { name?: string } | null | undefined, index: number): string {
  const n = clampStatsName(item && item.name);
  return n || statsLabel(index);
}

function nid(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function newTimeItem(type: "timer" | "stopwatch"): TimeItem {
  const t = type === "stopwatch" ? "stopwatch" : "timer";
  return {
    id: nid("t"),
    type: t,
    name: "",
    running: false,
    runStartedAt: null,
    durationMs: t === "timer" ? 60000 : 0,
    remainingMs: t === "timer" ? 60000 : 0,
    elapsedMs: 0,
    laps: [],
  };
}

export function newStatsItem(): StatsItem {
  return { id: nid("s"), name: "", pairs: padPairs([]) };
}

export function emptyState(): AppState {
  return {
    layout: { order: ["color"] },
    color: { count: 3, delayLo: "", delayHi: "" },
    chime: { mode: "fixed", fixed: 30, lo: 5, hi: 10 },
    time: { items: [] },
    stats: { items: [] },
  };
}

export function ensureState(raw: unknown): AppState {
  const d = emptyState();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<AppState>;
  return {
    layout: { order: uniqueOrder(r.layout?.order ?? d.layout.order) },
    color: {
      count: clampColorCount(r.color?.count ?? 3),
      delayLo: String(r.color?.delayLo ?? ""),
      delayHi: String(r.color?.delayHi ?? ""),
    },
    chime: {
      mode: r.chime?.mode === "random" ? "random" : "fixed",
      fixed: clampChimeSec(r.chime?.fixed, 30),
      lo: clampChimeSec(r.chime?.lo, 5),
      hi: clampChimeSec(r.chime?.hi, 10),
    },
    time: {
      items: Array.isArray(r.time?.items)
        ? (r.time!.items as TimeItem[]).slice(0, MAX_SUB).map((x) => ({
            ...x,
            name: clampTimeName(x.name),
            laps: Array.isArray(x.laps) ? x.laps.slice(0, MAX_LAPS) : [],
          }))
        : [],
    },
    stats: {
      items: Array.isArray(r.stats?.items)
        ? r.stats!.items.slice(0, MAX_STATS).map((x) => ({
            id: String(x.id),
            name: clampStatsName(x.name),
            pairs: padPairs(x.pairs),
          }))
        : [],
    },
  };
}
