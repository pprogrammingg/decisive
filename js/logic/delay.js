export const DELAY_MIN = 0.5;
export const DELAY_MAX = 900;
export const DELAY_STEP = 0.5;

export function parseNum(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const x = +t;
  return Number.isFinite(x) ? x : null;
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

function delayFieldErrors(n, word, emptyHint) {
  if (n === null) return [emptyHint];
  if (n < DELAY_MIN) return [word + " must be at least 0.5 seconds."];
  if (n > DELAY_MAX) return [word + " cannot be more than 900 seconds."];
  if (!isHalfStep(n)) return [word + " must be in steps of 0.5 seconds (for example 1 or 1.5)."];
  return [];
}

/** Same min/max rules as Color: 0.5–900, half steps, min ≤ max. */
export function delayRangeErrors(loStr, hiStr) {
  const lo = parseNum(loStr);
  const hi = parseNum(hiStr);
  const errors = delayFieldErrors(
    lo,
    "Min",
    "Enter a min time, or use the arrows. Min must be at least 0.5 seconds."
  ).concat(
    delayFieldErrors(
      hi,
      "Max",
      "Enter a max time, or use the arrows. Max can be up to 900 seconds."
    )
  );
  if (lo !== null && hi !== null && lo > hi) {
    errors.push("Min must be less than or equal to max.");
  }
  return errors;
}

export function delaySingleErrors(str, word = "Interval") {
  return delayFieldErrors(
    parseNum(str),
    word,
    "Enter a time, or use the arrows. " + word + " must be at least 0.5 seconds."
  );
}

export function delayStepCount(lo, hi) {
  const nLo = Math.round(lo / DELAY_STEP);
  const nHi = Math.round(hi / DELAY_STEP);
  return Math.max(1, nHi - nLo + 1);
}

/** Inclusive 0.5s step from min to max. New draw each call. */
export function nextHalfStepSec(lo, hi, random = Math.random) {
  const nLo = Math.round(lo / DELAY_STEP);
  const span = delayStepCount(lo, hi);
  let u = random();
  if (!Number.isFinite(u)) u = 0;
  if (u < 0) u = 0;
  if (u > 1) u = 1;
  let idx = (u * span) | 0;
  if (idx >= span) idx = span - 1;
  return (nLo + idx) * DELAY_STEP;
}
