export const PALETTE = [
  "#FF6F61",
  "#8B9BFF",
  "#E11D8F",
  "#F7F1E8",
  "#12121A",
  "#2DD4BF"
];

export const COLOR_SLOTS = 6;
export const COLOR_MIN_PICKED = 2;
export const COLOR_LOCKED = 2;
export const DELAY_MIN = 0.5;
export const DELAY_MAX = 900;
export const DELAY_STEP = 0.5;
export const SLOT_YELLOW = "#F5D547";
export const SLOT_CORAL = "#FF6F61";

export function defaultColor() {
  return {
    slots: [SLOT_YELLOW, SLOT_CORAL, "", "", "", ""],
    delayLo: "0.5",
    delayHi: "3"
  };
}

export function parseNum(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const x = +t;
  return Number.isFinite(x) ? x : null;
}

export function normalizeHex(raw) {
  if (raw == null) return "";
  const t = String(raw).trim();
  if (!t) return "";
  const m = t.match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return "";
  return "#" + m[1].toUpperCase();
}

export function padSlots(list) {
  const out = (Array.isArray(list) ? list : []).slice(0, COLOR_SLOTS).map(normalizeHex);
  while (out.length < COLOR_SLOTS) out.push("");
  return out;
}

export function pickedColors(slots) {
  return padSlots(slots).filter(Boolean);
}

export function slotLocked(index) {
  return (index | 0) < COLOR_LOCKED;
}

/** First two slots always have a colour. */
export function lockRequiredSlots(slots) {
  const out = padSlots(slots);
  if (!out[0]) out[0] = SLOT_YELLOW;
  if (!out[1]) out[1] = SLOT_CORAL;
  return out;
}

export function formatDelaySec(n) {
  const x = Math.round(Number(n) * 2) / 2;
  if (!Number.isFinite(x)) return "";
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}

export function isHalfStep(n) {
  if (!Number.isFinite(n)) return false;
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-6;
}

export function nudgeDelay(str, delta) {
  const n = parseNum(str);
  const base = n === null ? DELAY_MIN : n;
  const stepped = Math.round((base + delta) / DELAY_STEP) * DELAY_STEP;
  const x = Math.min(DELAY_MAX, Math.max(DELAY_MIN, stepped));
  return formatDelaySec(x);
}

export function colorSlotErrors(slots) {
  const n = pickedColors(slots).length;
  if (n >= COLOR_MIN_PICKED) return [];
  return [
    "Pick at least two colours. Empty cells are skipped — tap a cell to choose a colour, or ✕ to clear one."
  ];
}

export function colorDelayErrors(loStr, hiStr) {
  const errors = [];
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

export function colorSettingsErrors(color) {
  const c = color || {};
  return colorSlotErrors(c.slots).concat(colorDelayErrors(c.delayLo, c.delayHi));
}

export function colorChangeLabel(n, lo, hi) {
  const count = n | 0;
  if (lo === hi) return "Change between " + count + " colors every " + formatDelaySec(lo) + " seconds";
  return "Change between " + count + " colors every " + formatDelaySec(lo) + " to " + formatDelaySec(hi) + " seconds";
}

/** Valid min/max, or a safe fallback for corrupt saved state. */
export function colorDelayBounds(loStr, hiStr) {
  if (colorDelayErrors(loStr, hiStr).length) return { L: DELAY_MIN, U: 3 };
  return { L: parseNum(loStr), U: parseNum(hiStr) };
}

export function nextColorDelayMs(color, random = Math.random) {
  const z = colorDelayBounds(color && color.delayLo, color && color.delayHi);
  return ((z.L + random() * (z.U - z.L)) * 1e3) | 0;
}

export function activePalette(color) {
  const picked = pickedColors(color && color.slots);
  if (picked.length >= COLOR_MIN_PICKED) return picked;
  return pickedColors(defaultColor().slots);
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

function migrateSlots(raw) {
  if (Array.isArray(raw.slots)) return padSlots(raw.slots);
  const n = Number(raw.count);
  if (Number.isFinite(n) && n > 0) {
    const take = Math.min(COLOR_SLOTS, Math.max(0, n | 0));
    return padSlots(PALETTE.slice(0, take));
  }
  return defaultColor().slots.slice();
}

export function ensureColor(raw) {
  const d = defaultColor();
  if (!raw || typeof raw !== "object") return d;
  let slots = lockRequiredSlots(migrateSlots(raw));
  let delayLo = raw.delayLo == null ? d.delayLo : String(raw.delayLo);
  let delayHi = raw.delayHi == null ? d.delayHi : String(raw.delayHi);
  if (colorDelayErrors(delayLo, delayHi).length) {
    delayLo = d.delayLo;
    delayHi = d.delayHi;
  }
  return { slots, delayLo, delayHi };
}
