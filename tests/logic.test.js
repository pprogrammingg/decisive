import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { colorDelayBounds, clampColorCount, paletteForCount, PALETTE } from "../js/logic/color.js";
import { clampChimeSec, nextChimeDelaySec, ensureChime, formatChimeEta } from "../js/logic/chime.js";
import {
  addWidgets,
  canAdd,
  commitPicker,
  removeWidget,
  swapWidgets,
  togglePending,
  uniqueOrder,
  MAX_WIDGETS
} from "../js/logic/order.js";
import {
  addLap,
  addMinute,
  addTimeItem,
  canAddTimeItem,
  displayStopwatchMs,
  displayTimerMs,
  formatStopwatch,
  formatTimer,
  hmsToMs,
  MAX_LAPS,
  MAX_SUB,
  pauseItem,
  renameTimeItem,
  resetItem,
  startItem,
  TIME_NAME_MAX,
  timeDisplayName
} from "../js/logic/time.js";
import {
  addStatsItem,
  canAddStats,
  compactPairs,
  padPairs,
  statsLabel,
  clampStatsName,
  statsDisplayName,
  renameStatsItem,
  MAX_STATS,
  STATS_PAIRS
} from "../js/logic/stats.js";
import { ensureState, emptyState } from "../js/logic/state.js";

describe("color delay bounds (legacy B())", () => {
  it("both empty is 1–3 after swap", () => {
    assert.deepEqual(colorDelayBounds("", ""), { L: 1, U: 3 });
    assert.deepEqual(colorDelayBounds("  ", "\t"), { L: 1, U: 3 });
  });
  it("only lower 2 is 2–5", () => {
    assert.deepEqual(colorDelayBounds("2", ""), { L: 2, U: 5 });
  });
  it("only upper 2 is 0.5–2", () => {
    assert.deepEqual(colorDelayBounds("", "2"), { L: 0.5, U: 2 });
  });
  it("both ordered", () => {
    assert.deepEqual(colorDelayBounds("1", "4"), { L: 1, U: 4 });
  });
  it("reversed swapped", () => {
    assert.deepEqual(colorDelayBounds("4", "1"), { L: 1, U: 4 });
  });
  it("clamps", () => {
    assert.deepEqual(colorDelayBounds("0.1", "2"), { L: 0.5, U: 2 });
    assert.deepEqual(colorDelayBounds("2", "10"), { L: 2, U: 5 });
    assert.deepEqual(colorDelayBounds("0.2", "6"), { L: 0.5, U: 5 });
  });
  it("invalid treated as empty", () => {
    assert.deepEqual(colorDelayBounds("x", "3"), { L: 0.5, U: 3 });
    assert.deepEqual(colorDelayBounds("2", "oops"), { L: 2, U: 5 });
    assert.deepEqual(colorDelayBounds("x", "y"), { L: 1, U: 3 });
  });
});

describe("color palette", () => {
  it("clamps count 2–6", () => {
    assert.equal(clampColorCount(1), 2);
    assert.equal(clampColorCount(9), 6);
    assert.equal(clampColorCount("3"), 3);
  });
  it("uses coral periwinkle magenta first", () => {
    const p = paletteForCount(3);
    assert.equal(p[0], PALETTE[0]);
    assert.match(PALETTE[0], /#FF6F61/i);
    assert.match(PALETTE[1], /#8B9BFF/i);
    assert.match(PALETTE[2], /#E11D8F/i);
  });
});

describe("chime", () => {
  it("clamps 1–900", () => {
    assert.equal(clampChimeSec(0), 1);
    assert.equal(clampChimeSec(901), 900);
    assert.equal(clampChimeSec(7.4), 7);
  });
  it("fixed delay is N seconds", () => {
    assert.equal(nextChimeDelaySec({ mode: "fixed", fixed: 12, lo: 1, hi: 2 }), 12);
  });
  it("random stays in range", () => {
    const c = ensureChime({ mode: "random", lo: 5, hi: 10 });
    const a = nextChimeDelaySec(c, () => 0);
    const b = nextChimeDelaySec(c, () => 1);
    const mid = nextChimeDelaySec(c, () => 0.5);
    assert.equal(a, 5);
    assert.equal(b, 10);
    assert.equal(mid, 7.5);
  });
  it("swaps lo/hi if reversed", () => {
    const c = ensureChime({ mode: "random", lo: 10, hi: 5 });
    assert.equal(c.lo, 5);
    assert.equal(c.hi, 10);
  });
  it("eta label pauses and ceils seconds", () => {
    assert.equal(formatChimeEta(12500, false), "next  13s");
    assert.equal(formatChimeEta(4000, true), "paused  4s");
    assert.equal(formatChimeEta(0, true), "paused  0s");
  });
});

describe("widget order", () => {
  it("max 4 unique", () => {
    const o = uniqueOrder(["color", "chime", "time", "stats", "color", "nope"]);
    assert.deepEqual(o, ["color", "chime", "time", "stats"]);
    assert.equal(MAX_WIDGETS, 4);
  });
  it("cannot add duplicate or fifth", () => {
    assert.equal(canAdd(["color"], "color"), false);
    assert.equal(canAdd(["color", "chime", "time", "stats"], "color"), false);
    assert.equal(canAdd(["color"], "chime"), true);
  });
  it("picker pending + commit", () => {
    let p = togglePending(["color"], [], "chime");
    p = togglePending(["color"], p, "time");
    assert.deepEqual(commitPicker(["color"], p), ["color", "chime", "time"]);
    p = togglePending(["color", "chime", "time"], [], "stats");
    const extra = togglePending(["color", "chime", "time", "stats"], [], "color");
    assert.deepEqual(extra, []);
  });
  it("swap and remove", () => {
    assert.deepEqual(swapWidgets(["color", "chime"], "color", "chime"), ["chime", "color"]);
    assert.deepEqual(removeWidget(["color", "chime"], "color"), ["chime"]);
    assert.deepEqual(addWidgets(["color"], ["chime", "color"]), ["color", "chime"]);
  });
  it("pending cap at 4", () => {
    const p = togglePending(["color", "chime", "time"], ["stats"], "color");
    assert.deepEqual(p, ["stats"]);
    const blocked = togglePending(["color", "chime", "time"], ["stats"], "nope");
    assert.deepEqual(blocked, ["stats"]);
  });
});

describe("time sub-widgets", () => {
  it("max 5", () => {
    let items = [];
    for (let i = 0; i < 8; i++) items = addTimeItem(items, i % 2 ? "stopwatch" : "timer");
    assert.equal(items.length, MAX_SUB);
    assert.equal(canAddTimeItem(items), false);
  });
  it("timer remaining while running", () => {
    let it = { type: "timer", remainingMs: 5000, running: false, runStartedAt: null };
    it = startItem(it, 1000);
    assert.equal(displayTimerMs(it, 3000), 3000);
    it = pauseItem(it, 3000);
    assert.equal(it.remainingMs, 3000);
    assert.equal(it.running, false);
  });
  it("stopwatch elapsed + laps", () => {
    let it = { type: "stopwatch", elapsedMs: 0, running: false, runStartedAt: null, laps: [] };
    it = startItem(it, 0);
    it = addLap(it, 1500);
    assert.equal(it.laps[0], 1500);
    it = pauseItem(it, 2000);
    assert.equal(it.elapsedMs, 2000);
    it = resetItem(it);
    assert.equal(it.elapsedMs, 0);
    assert.deepEqual(it.laps, []);
  });
  it("caps laps at 30 (3×10 grid)", () => {
    let it = { type: "stopwatch", elapsedMs: 0, running: false, runStartedAt: 0, laps: [] };
    for (let i = 0; i < 40; i++) it = addLap(it, i * 100);
    assert.equal(it.laps.length, MAX_LAPS);
    assert.equal(MAX_LAPS, 30);
  });
  it("renames clamp to 15 chars", () => {
    assert.equal(TIME_NAME_MAX, 15);
    assert.equal(timeDisplayName({ type: "timer", name: "" }, 0), "Timer 1");
    let items = addTimeItem([], "timer");
    items = renameTimeItem(items, items[0].id, "warmup");
    assert.equal(timeDisplayName(items[0], 0), "warmup");
    items = renameTimeItem(items, items[0].id, "  abcdefghijklmnop  ");
    assert.equal(timeDisplayName(items[0], 0), "abcdefghijklmno");
    items = renameTimeItem(items, items[0].id, "   ");
    assert.equal(timeDisplayName(items[0], 0), "Timer 1");
    items = addTimeItem(items, "stopwatch");
    assert.equal(timeDisplayName(items[1], 1), "Stopwatch 2");
  });
  it("formats and +1:00", () => {
    assert.equal(formatTimer(65000), "01:05");
    assert.equal(formatStopwatch(61230), "01:01.23");
    assert.equal(hmsToMs(1, 2, 3), 3723000);
    const t = addMinute({ type: "timer", remainingMs: 1000, durationMs: 1000, running: false });
    assert.equal(t.remainingMs, 61000);
  });
});

describe("stats", () => {
  it("max 5 labels", () => {
    let items = [];
    for (let i = 0; i < 9; i++) items = addStatsItem(items);
    assert.equal(items.length, MAX_STATS);
    assert.equal(canAddStats(items), false);
    assert.equal(statsLabel(0), "stats1");
    assert.equal(statsLabel(4), "stats5");
  });
  it("10 pairs; empty keys ignored", () => {
    const compact = compactPairs([
      { key: "last", value: "Ada" },
      { key: "  ", value: "x" },
      { key: "keepups", value: "42" }
    ]);
    assert.equal(compact.length, 2);
    assert.equal(padPairs(compact).length, STATS_PAIRS);
  });
  it("renames clamp to 10 chars", () => {
    assert.equal(clampStatsName("micheal"), "micheal");
    assert.equal(clampStatsName("  abcdefghijkl  "), "abcdefghij");
    let items = addStatsItem([]);
    items = renameStatsItem(items, items[0].id, "micheal");
    assert.equal(statsDisplayName(items[0], 0), "micheal");
    items = renameStatsItem(items, items[0].id, "   ");
    assert.equal(statsDisplayName(items[0], 0), "stats1");
  });
});

describe("ensureState", () => {
  it("defaults to color widget", () => {
    const s = emptyState();
    assert.deepEqual(s.layout.order, ["color"]);
    assert.equal(ensureState(null).color.count, 3);
    assert.deepEqual(ensureState({ layout: { order: ["chime", "nope"] } }).layout.order, ["chime"]);
  });
});
