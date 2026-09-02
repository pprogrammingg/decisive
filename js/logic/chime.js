export const CHIME_MIN = 1;
export const CHIME_MAX = 900;

export function defaultChime() {
  return { mode: "fixed", fixed: 30, lo: 5, hi: 10 };
}

export function clampChimeSec(n, fallback = CHIME_MIN) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(CHIME_MAX, Math.max(CHIME_MIN, Math.round(x)));
}

export function ensureChime(raw) {
  const d = defaultChime();
  if (!raw || typeof raw !== "object") return d;
  const mode = raw.mode === "random" ? "random" : "fixed";
  let lo = clampChimeSec(raw.lo, d.lo);
  let hi = clampChimeSec(raw.hi, d.hi);
  if (lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  return {
    mode,
    fixed: clampChimeSec(raw.fixed, d.fixed),
    lo,
    hi
  };
}

/** Seconds until the next chime. Random draws a new value each call. */
export function nextChimeDelaySec(chime, random = Math.random) {
  const c = ensureChime(chime);
  if (c.mode === "fixed") return c.fixed;
  return c.lo + random() * (c.hi - c.lo);
}

export function nextChimeDelayMs(chime, random = Math.random) {
  return (nextChimeDelaySec(chime, random) * 1e3) | 0;
}

export function formatChimeEta(leftMs, paused) {
  const sec = Math.max(0, Math.ceil(leftMs / 1000));
  return (paused ? "paused  " : "next  ") + sec + "s";
}
