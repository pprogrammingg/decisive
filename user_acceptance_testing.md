# User acceptance testing

Fill `pass` as you run. Deployed URL: GitHub Pages (`https://<user>.github.io/<repo>/`).

---

## Feature name: Widget shell

### Localhost
1. Run `python3 dev/serve.py` and open `http://127.0.0.1:8080/`.
2. Expected: Colour widget fills the board; coral **+** is bottom-left, with a Phosphor **info** mark beside it (same circled-i style as the chime icons).
3. Tap the board **info**. Expected: a compact popout (no scroll) describes the drill board; tap outside or ✕ to close (it fades out).
4. Tap **+**. Expected: picker lists Color, Interval chime, Time, Stats. Color is dim with a **green check**. Others have a **blue/white +**.
5. Tap Interval chime and Time, then **Save**. Expected: 3-cell grid (two on top, one spanning below on wide screens).
6. On a widget bar, tap **info**. Expected: a short “what this is for” popout for that widget.
7. Drag a widget handle (⋮⋮) onto another. Expected: they swap; reload keeps the order.
8. Expand (↗) a widget. Expected: it covers the **whole screen**, gear visible if that widget has settings, **+** and board info hidden. Contract (↙) returns to the grid.
9. Remove (✕) a widget, confirm. Expected: confirm dialog matches the theme; widget gone.
10. Add until four widgets. Open picker. Expected: all four dim with green checks; cannot add a fifth type.

### GitHub Pages (github.io)
1. Open the Pages URL after deploy.
2. Repeat localhost steps 2–10.
3. Expected: same layout and persist after refresh (localStorage). PUT to `data/state.json` may 404; that is OK.

### Mobile app
1. `cd apps/mobile && npx expo start` and open in Expo Go.
2. Expected: same four widget types, **+** bottom-left with board **info**, picker checks vs add, expand/contract, confirm on remove, max 4. Widget-bar **info** opens the same short copy.
3. Long-press a widget, then tap another. Expected: positions swap.

---

## Feature name: Color change

### Localhost
1. With Color on the board (default), watch the fill. Expected: yellow and coral orange (unless you changed the pickers).
2. Expand Color, tap gear. Expected: 2×3 colour cells (first two filled with **no ✕**, rest **None**); **Min** / **Max** with − / + in 0.5 steps. Clicking the dimmed area around the box does not close it; only **Save** or **Cancel**.
3. Try to clear the first two cells. Expected: no ✕; they stay selected. Extra cells can be cleared.
4. Restore two colours. Set min `4`, max `2`. Expected: error *Min must be less than or equal to max*; **Save** disabled.
5. Set min `0.5`, max `3`. Expected: *Change between 2 colors every 0.5 to 3 seconds*; **Save** enabled. Save, confirm.
6. Set min = max (e.g. both `2`). Expected: *Change between N colors every 2 seconds*.
7. Shrink the widget. Expected: colour still cycles in the cell.

### GitHub Pages (github.io)
1. Open Pages, expand Color, change delay, Save, refresh.
2. Expected: settings persist (localStorage).

### Mobile app
1. Open Color widget, confirm cycling palette and settings (2×3 pickers, min/max 0.5–900). Save disabled on errors.
2. Expected: same behaviour as web; continues while other widgets are visible.

---

## Feature name: Interval sound chime

### Localhost
1. Add Interval chime. Tap **Tap to enable sound** if shown (or tap the page once).
2. Expand, gear: **Fixed** 5s, Save. Expected: a short chime about every 5s, even when shrunk.
3. Set **Random** 5–10s, Save. Expected: gaps vary between 5 and 10 seconds.
4. Try 1 and 900. Expected: values clamp; invalid input does not crash.
5. On the widget face, tap the circular **pause** control (Phosphor bars, not a bell). Expected: countdown freezes on **paused  Ns**, chime stops. Tap again (play triangle). Expected: countdown resumes from the remaining time and chimes continue.

### GitHub Pages (github.io)
1. Add chime, enable sound (browser gesture), set a short fixed interval.
2. Expected: chime plays; settings survive refresh.

### Mobile app
1. Add chime, set fixed/random 1–900s.
2. Expected: haptic/vibration pulse on interval (and visual flash); runs in the background of the grid.
3. Tap pause, then resume. Expected: interval holds while paused and continues from remaining time.

---

## Feature name: Time widget

### Localhost
1. Add Time. Tap **+ Add timer or stopwatch**, pick Timer. Repeat for Stopwatch. Add up to 5. Expected: sixth add is not offered.
2. Double-click the time (not the name) on a Timer row. Expected: that clock’s settings open (h/m/s, Start / Pause / Reset / +1:00).
3. Start a short timer. Expected: counts down; at 0 it stops and plays a done tone.
4. Open Stopwatch: Start, **Lap**, Pause. Expected: each Lap fills the next cell in a **3-column × 10-row** grid (down the first column, then the next). No Laps sheet. Reset clears the grid. The 31st Lap does not add.
5. Tap a **Timer 1** / **Stopwatch 1** label (not the digits). Type a name (max 15). Blur or Enter. Expected: label updates; empty falls back to Timer 1 / Stopwatch 1.
6. Remove a sub-widget. Expected: themed confirm, then gone. Refresh restores remaining items.

### GitHub Pages (github.io)
1. Create a timer and a stopwatch with a lap, refresh.
2. Expected: list and values restore; running clocks continue from saved timestamps.

### Mobile app
1. Same add/list/detail flow (not a WebView). Double-tap the time (not the name) to open that clock. Stopwatch shows a 3×10 lap grid; tap the name to rename (max 15).
2. Expected: max 5; confirm on delete.

---

## Feature name: Stats

### Localhost
1. Add Stats. Tap **+ Add stats1**. Expected: button **stats1**. Add up to **stats5**; no sixth.
2. Tap stats1. Expected: 10 key and 10 value fields. Enter last name / first name / keep-ups, Save (confirm).
3. Reopen. Expected: empty keys omitted from saved pairs; remaining keys still there.
4. Delete a sheet. Expected: confirm; buttons renumber stats1… in order.

### GitHub Pages (github.io)
1. Save stats pairs, refresh.
2. Expected: values persist.

### Mobile app
1. Same statsN buttons and 10×2 fields, persist on device.
2. Expected: max 5 sheets; confirm on delete and save.

---

## Feature name: Shared JSON + simultaneous widgets

### Localhost
1. Put Color, Chime, Time (running), and Stats on the board at once.
2. Expected: colour still flips, chime still sounds, timer still ticks in the shrunk cell.
3. Inspect `data/state.json` after using the dev server (or localStorage key `decisive.state.v1`). Expected: one object with `layout`, `color`, `chime`, `time`, `stats`.

### GitHub Pages (github.io)
1. Same four widgets running together on Pages.
2. Expected: simultaneous; state in localStorage if PUT is unavailable.

### Mobile app
1. Four widgets at once, kill and reopen the app.
2. Expected: AsyncStorage restores the same JSON shape; clocks/chime/colour still run together.
