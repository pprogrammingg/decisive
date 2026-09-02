import { defaultColor, ensureColor } from "./color.js";
import { defaultChime, ensureChime } from "./chime.js";
import { uniqueOrder } from "./order.js";
import { defaultTime, ensureTime } from "./time.js";
import { defaultStats, ensureStats } from "./stats.js";

export function emptyState() {
  return {
    layout: { order: ["color"] },
    color: defaultColor(),
    chime: defaultChime(),
    time: defaultTime(),
    stats: defaultStats()
  };
}

export function ensureState(raw) {
  const d = emptyState();
  if (!raw || typeof raw !== "object") return d;
  const order = uniqueOrder(raw.layout && raw.layout.order ? raw.layout.order : d.layout.order);
  return {
    layout: { order },
    color: ensureColor(raw.color),
    chime: ensureChime(raw.chime),
    time: ensureTime(raw.time),
    stats: ensureStats(raw.stats)
  };
}
