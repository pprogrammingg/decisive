import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PALETTE,
  SLOT_CORAL,
  SLOT_YELLOW,
  colorChangeLabel,
  colorDelayBounds,
  colorDelayErrors,
  colorSlotErrors,
  defaultColor,
  ensureColor,
  lockRequiredSlots,
  nextColorDelayMs,
  nextHalfStepSec,
  nudgeDelay,
  pickedColors,
  slotLocked
} from "../js/logic/color.js";
import { nextChimeDelaySec, ensureChime, formatChimeEta, chimeSettingsErrors, chimeChangeLabel } from "../js/logic/chime.js";
import {
  addWidgets,
  canAdd,
  commitPicker,
  removeWidget,
  swapWidgets,
  togglePending,
  uniqueOrder,
  APP_INFO,
  WIDGET_IDS,
  WIDGET_META,
  MAX_WIDGETS
} from "../js/logic/order.js";
import {
  addLap,
  addMinute,
  addTimeItem,
  canAddTimeItem,
  displayStopwatchMs,
  displayTimerMs,
  formatLapSplit,
  formatStopwatch,
  formatTimer,
  hmsToMs,
  lapSplitMs,
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
  removeStatsItem,
  renameStatsItem,
  MAX_STATS,
  STATS_PAIRS
} from "../js/logic/stats.js";
import { ensureState, emptyState } from "../js/logic/state.js";

describe("color settings", () => {
  it("defaults two slots yellow and coral, rest empty", () => {
    const d = defaultColor();
    assert.equal(d.slots[0], SLOT_YELLOW);
    assert.equal(d.slots[1], SLOT_CORAL);
    assert.equal(pickedColors(d.slots).length, 2);
    assert.equal(d.delayLo, "0.5");
    assert.equal(d.delayHi, "3");
  });
  it("first two slots cannot be emptied", () => {
    assert.equal(slotLocked(0), true);
    assert.equal(slotLocked(1), true);
    assert.equal(slotLocked(2), false);
    const locked = lockRequiredSlots(["", "", "#00FF00"]);
    assert.equal(locked[0], SLOT_YELLOW);
    assert.equal(locked[1], SLOT_CORAL);
    assert.equal(locked[2], "#00FF00");
  });
  it("requires at least two colours", () => {
    const e = colorSlotErrors(["#FF0000", "", "", "", "", ""]);
    assert.equal(e.length, 1);
    assert.match(e[0], /at least two/i);
    assert.deepEqual(colorSlotErrors(["#FF0000", "#00FF00"]), []);
  });
  it("delay: min 0.5, max 900, min <= max, half steps", () => {
    assert.ok(colorDelayErrors("", "3").length);
    assert.ok(colorDelayErrors("0.2", "3").some((m) => /0\.5/.test(m)));
    assert.ok(colorDelayErrors("1", "901").some((m) => /900/.test(m)));
    assert.ok(colorDelayErrors("4", "2").some((m) => /less than or equal/i.test(m)));
    assert.ok(colorDelayErrors("1.2", "3").some((m) => /0\.5/.test(m)));
    assert.deepEqual(colorDelayErrors("0.5", "900"), []);
    assert.deepEqual(colorDelayErrors("3", "3"), []);
  });
  it("nudge by 0.5 and clamp", () => {
    assert.equal(nudgeDelay("1", 0.5), "1.5");
    assert.equal(nudgeDelay("1", -0.5), "0.5");
    assert.equal(nudgeDelay("0.5", -0.5), "0.5");
    assert.equal(nudgeDelay("900", 0.5), "900");
    assert.equal(nudgeDelay("", 0.5), "1");
  });
  it("summary label", () => {
    assert.equal(colorChangeLabel(3, 0.5, 4), "Change between 3 colors every 0.5 to 4 seconds");
    assert.equal(colorChangeLabel(2, 5, 5), "Change between 2 colors every 5 seconds");
    assert.equal(colorChangeLabel(2, 12.5, 15), "Change between 2 colors every 12.5 to 15 seconds");
  });
  it("valid bounds used as-is; invalid falls back", () => {
    assert.deepEqual(colorDelayBounds("1", "4"), { L: 1, U: 4 });
    assert.deepEqual(colorDelayBounds("4", "1"), { L: 0.5, U: 3 });
  });
  it("each wait is a 0.5s step from min to max inclusive", () => {
    assert.equal(nextHalfStepSec(1, 2, () => 0), 1);
    assert.equal(nextHalfStepSec(1, 2, () => 0.5), 1.5);
    assert.equal(nextHalfStepSec(1, 2, () => 0.99), 2);
    assert.equal(nextHalfStepSec(1, 2, () => 1), 2);
    assert.equal(nextHalfStepSec(3, 3, () => 0.7), 3);
    const c = ensureColor({ slots: ["#FF0000", "#00FF00"], delayLo: "1", delayHi: "2" });
    assert.equal(nextColorDelayMs(c, () => 0), 1000);
    assert.equal(nextColorDelayMs(c, () => 0.5), 1500);
    assert.equal(nextColorDelayMs(c, () => 1), 2000);
  });
  it("migrates old count to slots; keeps yellow+coral default", () => {
    const m = ensureColor({ count: 3, delayLo: "1", delayHi: "4" });
    assert.equal(pickedColors(m.slots).length, 3);
    assert.equal(m.slots[0], PALETTE[0]);
    const fresh = ensureColor(null);
    assert.equal(fresh.slots[0], SLOT_YELLOW);
    assert.equal(fresh.slots[1], SLOT_CORAL);
  });
});

describe("chime", () => {
  it("fixed delay is N seconds", () => {
    assert.equal(nextChimeDelaySec({ mode: "fixed", fixed: 12, lo: 1, hi: 2 }), 12);
    assert.equal(nextChimeDelaySec({ mode: "fixed", fixed: 0.5, lo: 1, hi: 2 }), 0.5);
  });
  it("random wait is a 0.5s step from min to max inclusive", () => {
    const c = ensureChime({ mode: "random", lo: 1, hi: 2 });
    assert.equal(nextChimeDelaySec(c, () => 0), 1);
    assert.equal(nextChimeDelaySec(c, () => 0.5), 1.5);
    assert.equal(nextChimeDelaySec(c, () => 1), 2);
  });
  it("min/max errors match color; reversed range is invalid", () => {
    const bad = chimeSettingsErrors({ mode: "random", lo: "4", hi: "2" });
    assert.ok(bad.some((m) => /less than or equal/i.test(m)));
    assert.ok(chimeSettingsErrors({ mode: "fixed", fixed: "0.2" }).some((m) => /0\.5/.test(m)));
    assert.ok(chimeSettingsErrors({ mode: "fixed", fixed: "1.2" }).some((m) => /0\.5/.test(m)));
    assert.deepEqual(chimeSettingsErrors({ mode: "fixed", fixed: "0.5" }), []);
    assert.deepEqual(chimeSettingsErrors({ mode: "random", lo: "1", hi: "2" }), []);
    const kept = ensureChime({ mode: "random", lo: 4, hi: 2, fixed: 30 });
    assert.equal(kept.lo, 5);
    assert.equal(kept.hi, 10);
  });
  it("summary label", () => {
    assert.equal(chimeChangeLabel("fixed", 5, 1, 2), "Chime every 5 seconds");
    assert.equal(chimeChangeLabel("random", 30, 1, 2), "Chime every 1 to 2 seconds");
    assert.equal(chimeChangeLabel("random", 30, 3, 3), "Chime every 3 seconds");
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
  it("app and widget about copy exists", () => {
    assert.ok(APP_INFO.title);
    assert.ok(APP_INFO.about.length > 40);
    for (const id of WIDGET_IDS) {
      assert.ok(WIDGET_META[id].about.length > 20, id);
    }
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
    it = resetItem(it);
    assert.equal(it.remainingMs, 0);
    assert.equal(it.running, false);
    assert.equal(it.runStartedAt, null);
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
  it("lap split is delta to previous elapsed (sec.µs)", () => {
    const laps = [1500, 4000, 4123];
    assert.equal(lapSplitMs(laps, 0), 1500);
    assert.equal(lapSplitMs(laps, 1), 2500);
    assert.equal(formatLapSplit(1500), "1.500000");
    assert.equal(formatLapSplit(2500), "2.500000");
    assert.equal(formatLapSplit(123), "0.123000");
  });
  it("caps laps at MAX_LAPS (99)", () => {
    let it = { type: "stopwatch", elapsedMs: 0, running: false, runStartedAt: 0, laps: [] };
    for (let i = 0; i < 120; i++) it = addLap(it, i * 100);
    assert.equal(it.laps.length, MAX_LAPS);
    assert.equal(MAX_LAPS, 99);
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
    items = removeStatsItem(items, items[0].id);
    assert.equal(items.length, MAX_STATS - 1);
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
    assert.equal(pickedColors(ensureState(null).color.slots).length, 2);
    assert.deepEqual(ensureState({ layout: { order: ["chime", "nope"] } }).layout.order, ["chime"]);
  });
});
