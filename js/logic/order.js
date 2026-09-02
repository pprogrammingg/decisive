export const WIDGET_IDS = ["color", "chime", "time", "stats"];
export const MAX_WIDGETS = 4;

export const APP_INFO = {
  title: "Decisive",
  about: "A drill board for athletes and coaches. Keep reaction, interval, clock, and notes on one screen — up to four tools, all live — so the session does not stop for a phone clock or clipboard."
};

export const WIDGET_META = {
  color: {
    title: "Color change",
    blurb: "Full-screen colour drills",
    icon: "◐",
    about: "Reaction drills. Pick two to six colours. The fill flips after a random wait between min and max. Call the colour — or the action it means — before it changes."
  },
  chime: {
    title: "Interval chime",
    blurb: "Sound on a fixed or random beat",
    icon: "music-note",
    about: "A beep on a fixed or random beat for work/rest, keep-ups, or shuttles. Pause when you talk."
  },
  time: {
    title: "Time",
    blurb: "Timers and stopwatches",
    icon: "⏱",
    about: "Up to five timers and stopwatches. Tap a name to rename. Double-click the time to open that clock. Stopwatch laps fill a 3×10 grid."
  },
  stats: {
    title: "Stats",
    blurb: "Ten key / value field notes",
    icon: "▦",
    about: "Field notes: names, keep-ups, splits. Ten key/value pairs per sheet. Tap the name to rename; tap ▦ to open the fields."
  }
};

export function uniqueOrder(order) {
  const seen = new Set();
  const out = [];
  for (const id of order || []) {
    if (!WIDGET_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_WIDGETS) break;
  }
  return out;
}

export function canAdd(order, id) {
  const o = uniqueOrder(order);
  return WIDGET_IDS.includes(id) && !o.includes(id) && o.length < MAX_WIDGETS;
}

export function addWidgets(order, ids) {
  let o = uniqueOrder(order);
  for (const id of ids || []) {
    if (canAdd(o, id)) o = o.concat(id);
  }
  return o;
}

export function removeWidget(order, id) {
  return uniqueOrder(order).filter((x) => x !== id);
}

export function swapWidgets(order, a, b) {
  const o = uniqueOrder(order);
  const i = o.indexOf(a);
  const j = o.indexOf(b);
  if (i < 0 || j < 0 || i === j) return o;
  const next = o.slice();
  next[i] = o[j];
  next[j] = o[i];
  return next;
}

/** Stage adds in the picker. Existing ids stay; pending toggles; cap at 4. */
export function togglePending(order, pending, id) {
  const o = uniqueOrder(order);
  const p = pending.filter((x) => !o.includes(x) && WIDGET_IDS.includes(x));
  if (o.includes(id)) return p;
  if (p.includes(id)) return p.filter((x) => x !== id);
  if (o.length + p.length >= MAX_WIDGETS) return p;
  if (!WIDGET_IDS.includes(id)) return p;
  return p.concat(id);
}

export function commitPicker(order, pending) {
  return addWidgets(order, pending);
}
