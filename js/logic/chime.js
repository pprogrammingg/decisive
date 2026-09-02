import {
  delayRangeErrors,
  delaySingleErrors,
  formatDelaySec,
  nextHalfStepSec,
  parseNum
} from "./delay.js";

export { DELAY_MAX as CHIME_MAX, DELAY_MIN as CHIME_MIN } from "./delay.js";

export function defaultChime() {
  return { mode: "fixed", fixed: 30, lo: 5, hi: 10 };
}

function asDelayStr(v) {
  return v == null ? "" : String(v);
}

export function chimeSettingsErrors(chime) {
  const c = chime || {};
  const mode = c.mode === "random" ? "random" : "fixed";
  if (mode === "fixed") return delaySingleErrors(asDelayStr(c.fixed), "Interval");
  return delayRangeErrors(asDelayStr(c.lo), asDelayStr(c.hi));
}

export function chimeChangeLabel(mode, fixed, lo, hi) {
  if (mode !== "random") return "Chime every " + formatDelaySec(fixed) + " seconds";
  if (lo === hi) return "Chime every " + formatDelaySec(lo) + " seconds";
  return "Chime every " + formatDelaySec(lo) + " to " + formatDelaySec(hi) + " seconds";
}

export function ensureChime(raw) {
  const d = defaultChime();
  if (!raw || typeof raw !== "object") return d;
  const mode = raw.mode === "random" ? "random" : "fixed";
  let fixed = raw.fixed;
  if (delaySingleErrors(asDelayStr(fixed), "Interval").length) fixed = d.fixed;
  else fixed = parseNum(asDelayStr(fixed));
  let lo = raw.lo;
  let hi = raw.hi;
  if (delayRangeErrors(asDelayStr(lo), asDelayStr(hi)).length) {
    lo = d.lo;
    hi = d.hi;
  } else {
    lo = parseNum(asDelayStr(lo));
    hi = parseNum(asDelayStr(hi));
  }
  return { mode, fixed, lo, hi };
}

/** Seconds until the next chime. Random draws a new 0.5s step each call. */
export function nextChimeDelaySec(chime, random = Math.random) {
  const c = ensureChime(chime);
  if (c.mode === "fixed") return c.fixed;
  return nextHalfStepSec(c.lo, c.hi, random);
}

export function nextChimeDelayMs(chime, random = Math.random) {
  return (nextChimeDelaySec(chime, random) * 1e3) | 0;
}

export function formatChimeEta(leftMs, paused) {
  const sec = Math.max(0, Math.ceil(leftMs / 1000));
  return (paused ? "paused  " : "next  ") + sec + "s";
}
