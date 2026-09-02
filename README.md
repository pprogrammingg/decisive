# Decisive

[![CI](https://github.com/pprogrammingg/decisive/actions/workflows/ci.yml/badge.svg)](https://github.com/pprogrammingg/decisive/actions/workflows/ci.yml)
![tests](badges/tests.svg)
![security](badges/security.svg)

Athletic decision-making drills. Up to **four widgets** on one board. They run at the same time. State is one JSON object.

Web is vanilla HTML / CSS / JS (no build). Mobile is Expo (`apps/mobile`).

---

## Commands

From the **repo root**:

| Command | What it does |
|---|---|
| `python3 dev/serve.py` | Local server with no-cache static files + `PUT /data/state.json`. Prints `http://127.0.0.1:8080/` (or the next free port). |
| `npm run serve` | Same as the line above. |
| `npm test` | Unit tests (`tests/logic.test.js`). |
| `node --test tests/*.test.js` | Same tests, no npm. |
| `npm run ci` | Tests + security scan + refresh `badges/tests.svg` and `badges/security.svg`. Exit `1` if anything fails. |
| `node scripts/ci.mjs` | Same as `npm run ci`. |
| `npm run mobile` | `expo start` in `apps/mobile` (run `npm install` there first). |

Open `index.html` in a browser with no server if you only need a tryout. Persist then uses **`localStorage`** only (`PUT` needs `dev/serve.py`).

### Mobile (`apps/mobile`)

```bash
cd apps/mobile
npm install
npx expo start              # QR → Expo Go
npx expo start --android
npx expo start --ios
```

Or from repo root after install: `npm run mobile`.

### GitHub Pages

Serve the **repo root** as the site. Persist falls back to `localStorage` when `PUT data/state.json` is not available. First visit can still `GET data/state.json` as the seed.

### CI (GitHub Actions)

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- every **pull request**
- every **push to `main`**
- **every day at 06:00 UTC**
- **Run workflow** in the Actions tab

It runs `node scripts/ci.mjs` (unit tests + static security scan). If `apps/mobile/package-lock.json` exists, it also runs `npm audit --omit=dev --audit-level=high`. On `main`, it commits updated badge SVGs when they change.

The **tests** and **security** images at the top of this file are those SVGs (`100%` when all tests pass and the scan is clean). The **CI** pill is GitHub’s live workflow status.

---

## Board (all widgets)

Default board: **Color change** already added.

| Control | Where | What |
|---|---|---|
| **+** | Bottom left | Opens the add picker. |
| **⋮⋮** | Widget bar | Drag onto another widget to **swap** places. Hidden in full screen. |
| **⚙** | Widget bar | Settings (Color, Chime, Time, Stats). Works in **grid and full** size. |
| **↗ / ↙** | Widget bar | Expand covers the whole screen / contract back to the grid. Hidden when only **one** widget is on the board (it already fills the screen). |
| **✕** | Widget bar | Remove this widget (confirm). |

**Add picker**

1. Tap **+**.
2. Four types: Color change, Interval chime, Time, Stats.
3. Already on the board: dimmer + **green check** (cannot add a second copy).
4. Available: full colour + **blue/white +**. Tap to stage; tap again to unstage.
5. You can stage several, then **Save**. Max **4** widgets on the board.
6. Cancel leaves the board unchanged.

**Grid**

- 1 widget → one cell. 2 → two cells (stacked on a narrow phone). 3 → two on top, one spanning. 4 → 2×2.
- Shrunk widgets keep running (colour, chime, clocks).
- Full screen: widget covers the whole viewport, **+** is hidden. Contract (↙) returns it to its grid cell.

**Persist**

- Dev server: `data/state.json` (and `localStorage` key `decisive.state.v1`).
- Pages / file open: `localStorage` only.
- Mobile: AsyncStorage, same JSON shape.

Reload the page/app: layout and settings come back.

---

## Widget tutorials

### 1. Color change ◐

Full-cell colour drills (coral, periwinkle, magenta, then cream / ink / teal).

1. It is on the board by default. The fill changes on a random delay.
2. Tap **⚙**. Slider: how many colours **2–6**. Lower / upper delay in seconds (**0.5–5**). Empty bounds use the original default range (about 1–3 s).
3. **Save** → confirm **Save these settings?**
4. Cycle continues in the small cell and in full screen.

**Drill idea:** call the colour you see (or the next action it means) before it flips.

---

### 2. Interval chime 🔔

A tone (web) or vibration (mobile) on a clock.

1. **+** → Interval chime → Save.
2. Tap the page once (or **Tap to enable sound**) so the browser allows audio.
3. **⚙** → **Fixed** every N seconds, or **Random** between lower and upper. Range **1–900** s.
   - Random 5–10: a chime, then maybe 7 s, then 6 s, then 10 s…
4. Save + confirm. The countdown in the widget is seconds until the next hit.
5. Shrink the widget: it still chimes.

---

### 3. Time ⏱

Up to **5** clocks. Types: **timer** (Android-like) and **stopwatch**.

**Add a clock**

1. **+** → Time → Save (if it is not already on the board).
2. **+ Add timer or stopwatch** → Timer or Stopwatch. Stop at 5; the add row disappears.
3. Or tap **⚙**: if the list is empty, the same add dialog; if several clocks, pick which one to open.

**Timer**

1. Tap the **Timer N** row (opens the set/run screen in the widget — grid or full).
2. Set **h / m / s**. Digits show remaining time.
3. **Start** / **Pause** / **Reset** / **+1:00**.
4. At 0 it stops and plays a done tone (after sound is enabled).
5. **←** back to the list. **✕** on a row deletes that clock (confirm).

**Stopwatch**

1. Tap **Stopwatch N**.
2. **Start** / **Pause** / **Reset** / **Lap**.
3. **Laps** opens a sheet of lap times; tap **Laps** again to hide it. Laps are hidden until you ask.

Clocks keep ticking when the Time widget is shrunk.

---

### 4. Stats ▦

Field notes: last name, first name, keep-ups, sprint speed, etc.

1. **+** → Stats → Save.
2. **+ Add stats1** (then stats2 … up to **stats5**).
3. **Tap the name** (e.g. `stats1`) — it becomes an input. Type a label like `micheal` (**max 10 characters**). Tap/click outside (or Enter) to save. Empty name falls back to `stats1`.
4. Tap **▦** on the chip (or **⚙** on the widget) to open the **10 key / 10 value** dialog. Save → confirm.
5. Empty keys are dropped on save; the rest come back when you reopen.
6. Delete a sheet from that dialog if offered. Custom names persist with the sheet.

---

## Four at once

Add Color, Chime, Time (running), and Stats. Colour still flips, chime still hits, timers still count in the small cells. That is the intended drill board.

---

## Layout (code)

See `roadmap.md` for phases (including security scan and Play / App Store). UAT steps: `user_acceptance_testing.md`.

```
index.html
css/          theme, layout, dialog, widgets
js/           store, dialog, grid, app
js/logic/     pure functions (tested)
js/widgets/   color, chime, time, stats
data/state.json
tests/logic.test.js
scripts/ci.mjs
badges/       tests.svg, security.svg
apps/mobile/  Expo
```
