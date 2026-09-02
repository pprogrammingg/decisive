export const PALETTE = [
  "#FF6F61", // coral
  "#8B9BFF", // periwinkle
  "#E11D8F", // magenta
  "#F7F1E8", // cream
  "#12121A", // ink
  "#2DD4BF"  // teal
];

export const COLOR_MIN = 2;
export const COLOR_MAX = 6;
export const DELAY_MIN = 0.5;
export const DELAY_MAX = 5;

export function defaultColor() {
  return { count: 3, delayLo: "", delayHi: "" };
}

export function clampColorCount(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return COLOR_MIN;
  return Math.min(COLOR_MAX, Math.max(COLOR_MIN, x | 0));
}

export function parseNum(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const x = +t;
  return Number.isFinite(x) ? x : null;
}

/** Mirror original index.html B() delay bounds. */
export function colorDelayBounds(loStr, hiStr) {
  const pl = parseNum(loStr);
  const ph = parseNum(hiStr);
  let x, y;
  if (pl === null && ph === null) {
    x = 3;
    y = 1;
  } else if (pl === null && ph !== null) {
    x = 0.5;
    y = Math.min(DELAY_MAX, Math.max(DELAY_MIN, ph));
  } else if (pl !== null && ph === null) {
    x = Math.min(DELAY_MAX, Math.max(DELAY_MIN, pl));
    y = DELAY_MAX;
  } else {
    x = Math.min(DELAY_MAX, Math.max(DELAY_MIN, pl));
    y = Math.min(DELAY_MAX, Math.max(DELAY_MIN, ph));
  }
  if (x > y) {
    const t = x;
    x = y;
    y = t;
  }
  return { L: x, U: y };
}

export function nextColorDelayMs(color, random = Math.random) {
  const z = colorDelayBounds(color.delayLo, color.delayHi);
  return ((z.L + random() * (z.U - z.L)) * 1e3) | 0;
}

export function paletteForCount(count) {
  return PALETTE.slice(0, clampColorCount(count));
}

export function isLightHex(hex) {
  const h = String(hex).replace("#", "");
  if (h.length !== 6) return false;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 168;
}

export function ensureColor(raw) {
  const d = defaultColor();
  if (!raw || typeof raw !== "object") return d;
  return {
    count: clampColorCount(raw.count ?? d.count),
    delayLo: raw.delayLo == null ? d.delayLo : String(raw.delayLo),
    delayHi: raw.delayHi == null ? d.delayHi : String(raw.delayHi)
  };
}
