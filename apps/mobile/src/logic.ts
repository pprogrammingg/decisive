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

export const APP_INFO = {
  title: "Decisive",
  about:
    "A drill board for athletes and coaches. Keep reaction, interval, clock, and notes on one screen — up to four tools, all live — so the session does not stop for a phone clock or clipboard.",
};

export const WIDGET_META: Record<
  WidgetId,
  { title: string; blurb: string; icon: string; about: string }
> = {
  color: {
    title: "Color change",
    blurb: "Full-screen colour drills",
    icon: "◐",
    about: "Reaction drills. Pick two to six colours. The fill flips after a random wait between min and max. Call the colour — or the action it means — before it changes.",
  },
  chime: {
    title: "Interval chime",
    blurb: "Sound on a fixed or random beat",
    icon: "music-note",
    about: "A beep on a fixed or random beat for work/rest, keep-ups, or shuttles. Pause when you talk.",
  },
  time: {
    title: "Time",
    blurb: "Timers and stopwatches",
    icon: "⏱",
    about: "Up to five timers and stopwatches. Tap a name to rename. Double-tap the time to open that clock. Stopwatch laps fill a 3×10 grid.",
  },
  stats: {
    title: "Stats",
    blurb: "Ten key / value field notes",
    icon: "▦",
    about: "Field notes: names, keep-ups, splits. Ten key/value pairs per sheet. Tap the name to rename; tap ▦ to open the fields.",
  },
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

export type ColorState = { slots: string[]; delayLo: string; delayHi: string };
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

export const COLOR_SLOTS = 6;
export const COLOR_MIN_PICKED = 2;
export const COLOR_LOCKED = 2;
export const DELAY_MIN = 0.5;
export const DELAY_MAX = 900;
export const DELAY_STEP = 0.5;
export const SLOT_YELLOW = "#F5D547";
export const SLOT_CORAL = "#FF6F61";

export function defaultColor(): ColorState {
  return {
    slots: [SLOT_YELLOW, SLOT_CORAL, "", "", "", ""],
    delayLo: "0.5",
    delayHi: "3",
  };
}

export function parseNum(s: unknown): number | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const x = +t;
  return Number.isFinite(x) ? x : null;
}

export function normalizeHex(raw: unknown): string {
  if (raw == null) return "";
  const t = String(raw).trim();
  if (!t) return "";
  const m = t.match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return "";
  return "#" + m[1].toUpperCase();
}

export function padSlots(list: unknown): string[] {
  const out = (Array.isArray(list) ? list : []).slice(0, COLOR_SLOTS).map(normalizeHex);
  while (out.length < COLOR_SLOTS) out.push("");
  return out;
}

export function pickedColors(slots: unknown): string[] {
  return padSlots(slots).filter(Boolean);
}

export function slotLocked(index: number): boolean {
  return (index | 0) < COLOR_LOCKED;
}

export function lockRequiredSlots(slots: unknown): string[] {
  const out = padSlots(slots);
  if (!out[0]) out[0] = SLOT_YELLOW;
  if (!out[1]) out[1] = SLOT_CORAL;
  return out;
}

export function formatDelaySec(n: number): string {
  const x = Math.round(Number(n) * 2) / 2;
  if (!Number.isFinite(x)) return "";
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}

export function isHalfStep(n: number): boolean {
  if (!Number.isFinite(n)) return false;
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-6;
}

export function nudgeDelay(str: unknown, delta: number): string {
  const n = parseNum(str);
  const base = n === null ? DELAY_MIN : n;
  const stepped = Math.round((base + delta) / DELAY_STEP) * DELAY_STEP;
  const x = Math.min(DELAY_MAX, Math.max(DELAY_MIN, stepped));
  return formatDelaySec(x);
}

export function colorSlotErrors(slots: unknown): string[] {
  const n = pickedColors(slots).length;
  if (n >= COLOR_MIN_PICKED) return [];
  return [
    "Pick at least two colours. Empty cells are skipped — tap a cell to choose a colour, or ✕ to clear one.",
  ];
}

export function colorDelayErrors(loStr: unknown, hiStr: unknown): string[] {
  const errors: string[] = [];
  const lo = parseNum(loStr);
  const hi = parseNum(hiStr);
  if (lo === null) {
    errors.push("Enter a min time, or use the arrows. Min must be at least 0.5 seconds.");
  } else {
    if (lo < DELAY_MIN) errors.push("Min must be at least 0.5 seconds.");
    else if (lo > DELAY_MAX) errors.push("Min cannot be more than 900 seconds.");
    else if (!isHalfStep(lo)) errors.push("Min must be in steps of 0.5 seconds (for example 1 or 1.5).");
  }
  if (hi === null) {
    errors.push("Enter a max time, or use the arrows. Max can be up to 900 seconds.");
  } else {
    if (hi < DELAY_MIN) errors.push("Max must be at least 0.5 seconds.");
    else if (hi > DELAY_MAX) errors.push("Max cannot be more than 900 seconds.");
    else if (!isHalfStep(hi)) errors.push("Max must be in steps of 0.5 seconds (for example 1 or 1.5).");
  }
  if (lo !== null && hi !== null && lo > hi) {
    errors.push("Min must be less than or equal to max.");
  }
  return errors;
}

export function colorSettingsErrors(color: { slots?: unknown; delayLo?: unknown; delayHi?: unknown } | null | undefined): string[] {
  const c = color || {};
  return colorSlotErrors(c.slots).concat(colorDelayErrors(c.delayLo, c.delayHi));
}

export function colorChangeLabel(n: number, lo: number, hi: number): string {
  const count = n | 0;
  if (lo === hi) return "Change between " + count + " colors every " + formatDelaySec(lo) + " seconds";
  return "Change between " + count + " colors every " + formatDelaySec(lo) + " to " + formatDelaySec(hi) + " seconds";
}

export function colorDelayBounds(loStr: unknown, hiStr: unknown): { L: number; U: number } {
  if (colorDelayErrors(loStr, hiStr).length) return { L: DELAY_MIN, U: 3 };
  return { L: parseNum(loStr) as number, U: parseNum(hiStr) as number };
}

export function nextColorDelayMs(color: ColorState, random = Math.random): number {
  const z = colorDelayBounds(color.delayLo, color.delayHi);
  return ((z.L + random() * (z.U - z.L)) * 1e3) | 0;
}

export function activePalette(color: ColorState): string[] {
  const picked = pickedColors(color.slots);
  if (picked.length >= COLOR_MIN_PICKED) return picked;
  return pickedColors(defaultColor().slots);
}

export function isLightHex(hex: string): boolean {
  const h = String(hex).replace("#", "");
  if (h.length !== 6) return false;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 168;
}

function migrateSlots(raw: { slots?: unknown; count?: unknown }): string[] {
  if (Array.isArray(raw.slots)) return padSlots(raw.slots);
  const n = Number(raw.count);
  if (Number.isFinite(n) && n > 0) {
    const take = Math.min(COLOR_SLOTS, Math.max(0, n | 0));
    return padSlots(PALETTE.slice(0, take));
  }
  return defaultColor().slots.slice();
}

export function ensureColor(raw: unknown): ColorState {
  const d = defaultColor();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as { slots?: unknown; count?: unknown; delayLo?: unknown; delayHi?: unknown };
  let slots = lockRequiredSlots(migrateSlots(r));
  let delayLo = r.delayLo == null ? d.delayLo : String(r.delayLo);
  let delayHi = r.delayHi == null ? d.delayHi : String(r.delayHi);
  if (colorDelayErrors(delayLo, delayHi).length) {
    delayLo = d.delayLo;
    delayHi = d.delayHi;
  }
  return { slots, delayLo, delayHi };
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
    color: defaultColor(),
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
    color: ensureColor(r.color),
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
