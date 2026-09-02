# Decisive roadmap

Athletic decision-making drills. The home screen is a **widget grid** (max 4). Each widget is a specialized screen. Widgets run at the same time. State lives in one shared JSON file.

Web stays **HTML, CSS, and vanilla JS** — no framework, no bundler unless GitHub Pages or tests force a tiny helper. Split files and keep them refactored. Mobile follows the Expo pattern in `../sub_zero`.

Machine-readable mirror: [roadmap.json](roadmap.json).

## Commit messages

Every commit: **`<EPIC_CODE>-<TASK> : <description>`** (enforced by `.githooks/commit-msg`).

Enable hooks once: `./scripts/setup-git-hooks.sh`

| Epic | Code |
|------|------|
| Epic tasks and commit association | RM001 |
| Foundation | FO001 |
| Widget shell | WS001 |
| Color change | CC001 |
| Interval sound chime | IC001 |
| Time | TM001 |
| Stats | ST001 |
| Deploy + parity | DP001 |
| Board UX (info, color pickers, chrome) | UX001 |
| Security scan and fix | SC001 |
| Android Play Store | AN001 |
| iOS App Store | IO001 |

Commits **before** this format are associated by short SHA on each epic’s `commits` array in `roadmap.json` (do not rewrite history). After a task lands, append the new SHA there.

---

## Constraints (every task)

| Rule | Detail |
|---|---|
| Max widgets | 4. Cannot add a fifth. |
| Full size | Roughly one mobile screen. |
| Shrunk size | Fits the current grid cell. |
| Grid | 1 widget → 1 cell. 2 → 2 cells. 3 → 3 cells. 4 → 2×2. |
| Expand / contract | Arrow toggles full-screen vs grid cell. |
| Drag | Drag a widget onto another; positions swap / push. Order is fluid. |
| Gear | Settings only in **full-screen** mode. |
| Add | Bottom-**left** plus circle → picker dialog → add several → Save. |
| Remove | Confirm dialog (same family as all other confirms). |
| Simultaneous | Color, chime, timers, stats keep running when shrunk. |
| Persist | One shared JSON (`data/state.json` locally; GitHub Pages uses the same shape via fetch + localStorage fallback). Each widget loads only its slice. |
| Design | Energy, slick: grid, colour, borders, motion. Dialogs match the theme. |
| Tests | Unit-test logic where it can be extracted (bounds, intervals, grid, store). |
| Mobile | Every feature has an Expo app counterpart (`apps/mobile`), patterned on `../sub_zero`. |
| UAT | Every feature appends a named section to `user_acceptance_testing.md` with steps for **localhost**, **GitHub Pages**, and **mobile app**. |
| Security | Scan before each store/Pages release. Fix findings, then re-scan. No secrets in the repo. |

---

## Target layout (web)

Keep modules small. Prefer CSS for layout and motion.

```
index.html
css/theme.css          colour tokens, type, energy
css/layout.css         home, grid, expand/contract
css/dialog.css         confirm + settings + add-picker
css/widgets.css        per-widget chrome
js/store.js            load / save shared JSON
js/dialog.js           confirm, settings shell, picker
js/grid.js             cells, drag, expand, add/remove
js/widgets/color.js
js/widgets/chime.js
js/widgets/time.js
js/widgets/stats.js
data/state.json
tests/                 python or node unit tests
apps/mobile/           Expo, same widget model
user_acceptance_testing.md
```

Suggested `state.json` shape (adjust as you implement, keep it lean):

```json
{
  "layout": { "order": ["color"] },
  "color": { "slots": ["#F5D547", "#FF6F61", "", "", "", ""], "delayLo": "0.5", "delayHi": "3" },
  "chime": { "mode": "random", "lo": 5, "hi": 10 },
  "time": { "items": [] },
  "stats": { "items": [] }
}
```

---

## Epic: Epic tasks and commit association (`RM001`)

Codify work as epics/tasks and associate git commits (`<EPIC_CODE>-<TASK> : …`).

- [x] **RM001-1** — `roadmap.md` + `roadmap.json` with epic codes and task ids
- [x] **RM001-2** — `commit-msg` hook + `scripts/setup-git-hooks.sh`
- [x] **RM001-3** — Cursor rule (`epic-commits.mdc`) + feature-delivery commit line

---

## Epic: Foundation (`FO001`)

Shared chrome so widgets do not invent their own dialogs, theme, or persist.

- [x] **FO001-1** — Theme — CSS tokens: coral, periwinkle, magenta, ink, glow. High energy, not toy-orange. Widget borders, grid gap, full-screen vs cell.
- [x] **FO001-2** — Split the current `index.html` — HTML shell + CSS files + JS modules. Colour cycle still works. No behaviour loss.
- [x] **FO001-3** — Dialog system — One confirm (delete / save settings) and one settings panel. Same overlay, type, buttons, motion. Reuse for every later dialog.
- [x] **FO001-4** — Store — `load()` / `save()` against shared JSON. Widgets read only their key. Safe defaults if a key is missing.
- [x] **FO001-5** — Test harness — Extract pure functions; unit tests in `tests/logic.test.js`.
- [x] **FO001-6** — UAT file — Create `user_acceptance_testing.md` with the section format below.
- [x] **FO001-7** — Mobile scaffold — `apps/mobile` Expo app like `../sub_zero`: shared state shape, AsyncStorage persist, one home screen stub.

UAT section format:

```md
## Feature name: <Name>

### Localhost
1. …
2. Expected: …

### GitHub Pages (github.io)
1. …
2. Expected: …

### Mobile app
1. …
2. Expected: …
```

---

## Epic: Widget shell (`WS001`)

Home is an empty (or colour-only) board plus the add control.

### WS001-1 Home + add picker

- [x] **WS001-1** — Circle **+** fixed bottom-left (safe-area aware). Picker lists the four types (icon + short text). Already added: dimmer + **green check**. Available: full colour + **blue/white add**. Toggle several; **Save** commits; max 4; no duplicate types.

### WS001-2 Grid + expand / contract

- [x] **WS001-2** — Chrome with **expand/contract arrow**. Full: ~mobile viewport, gear visible. Shrunk: cell; gear hidden. 2 → 2-cell grid. 3 → 3 cells. 4 → 2×2. Empty cells do not show.

### WS001-3 Remove + drag

- [x] **WS001-3** — Remove with **confirm**; Save settings uses the same confirm family. Drag onto another cell: swap / push. Persist `layout.order` after add, remove, drag.

### WS001-4 Simultaneous runtime

- [x] **WS001-4** — Scheduler so shrunk widgets keep ticking (colour, chime, clocks).

**UAT:** Widget shell (add picker, grid counts, expand, remove confirm, drag, max 4).

---

## Epic: Color change (`CC001`)

Most of this already lives in `index.html`. Wrap it as a widget; do not rewrite the delay math without tests.

- [x] **CC001-1** — Mount existing cycle inside the colour widget (full + shrunk: fill the widget, not the whole page when other widgets exist).
- [x] **CC001-2** — Palette: **coral, periwinkle, magenta**, plus a few elegant companions (not harsh orange/lime). Keep enough contrast for drills.
- [x] **CC001-3** — Gear (full-screen only): colour count (2–6) and random delay range — first ship, restyled to the dialog system.
- [x] **CC001-4** — Confirm on save settings.
- [x] **CC001-5** — Unit tests: keep / port delay-bound tests; add palette-count clamp.
- [x] **CC001-6** — Mobile: same cycle + settings.
- [x] **CC001-7** — **UAT:** Color change

Slot pickers and delay steppers are **UX001**, not a rewrite of this epic.

---

## Epic: Interval sound chime (`IC001`)

A chime on a timer. Runs even when the widget is shrunk.

- [x] **IC001-1** — Gear: **fixed** every N seconds, or **random** between lo–hi. Range **1–900 s**. Random example: 5–10 s → chime at 7s, then 6s, then 10s, then 5s (new draw after each chime).
- [x] **IC001-2** — Short, clear chime (Web Audio or a tiny bundled sound). Respect autoplay: start after a user gesture if the browser blocks it; show a quiet “tap to enable sound” in the widget if needed.
- [x] **IC001-3** — Confirm on save settings.
- [x] **IC001-4** — Unit tests: clamp 1–900, fixed vs random next-delay.
- [x] **IC001-5** — Mobile: `Audio` / Expo AV; same settings.
- [x] **IC001-6** — **UAT:** Interval sound chime

Louder chime is **UX001-5**.

---

## Epic: Time (`TM001`)

The time widget is a **list of sub-widgets** (max **5**). Types: **timer** and **stopwatch**. Look and feel follow Android Clock: timer (digits, start/pause/reset, +1:00) and stopwatch (run, lap, reset; **laps hidden behind a Laps button** that opens a history sheet).

- [x] **TM001-1** — Rows: add sub-widget → pick timer or stopwatch. Cap at 5.
- [x] **TM001-2** — Tap a row → expand that sub-widget to the widget’s full area to set / run it. Back returns to the row list. Stopwatch: laps panel closed by default; Laps opens history.
- [x] **TM001-3** — Remove a sub-widget via confirm. Persist each sub-widget (type, remaining/elapsed, laps, running flag — restore reasonably on reload).
- [x] **TM001-4** — Unit tests: tick math, lap list, max-5.
- [x] **TM001-5** — Mobile: same Android-like layout (RN views, not a WebView of the page).
- [x] **TM001-6** — **UAT:** Time widget

---

## Epic: Stats (`ST001`)

Field notes: last name, first name, keep-ups, sprint speed, etc.

- [x] **ST001-1** — Max **5** sub-widgets. Each add creates a button `stats1` … `stats5`.
- [x] **ST001-2** — Tap a button → panel with **10 key inputs** and **10 value inputs**. Persist keys/values per stats slot.
- [x] **ST001-3** — Remove slot via confirm; renumber labels if needed (keep it obvious: `stats1`… in list order).
- [x] **ST001-4** — Unit tests: max 5, 10 pairs, empty keys ignored on save.
- [x] **ST001-5** — Mobile: same buttons + 10×2 fields.
- [x] **ST001-6** — **UAT:** Stats

---

## Epic: Deploy + parity (`DP001`)

- [x] **DP001-1** — GitHub Pages (`github.io`): static web root; persist via localStorage if PUT is unavailable, same JSON shape.
- [x] **DP001-2** — Widgets still simultaneous on Pages.
- [x] **DP001-3** — Fill UAT **GitHub Pages** steps for every feature shipped.
- [x] **DP001-4** — Mobile UAT for every feature; store on device (AsyncStorage), same schema.

---

## Epic: Board UX (`UX001`)

Info popouts, colour slot pickers, settings dismiss rules, chrome polish, louder chime.

- [x] **UX001-1** — Board info beside **+**; per-widget info on the bar; compact no-scroll popout (web + mobile).
- [x] **UX001-2** — Color: 2×3 slots (first two locked), delay min 0.5 / max 900, ±0.5 steppers, summary line, Save disabled on errors.
- [x] **UX001-3** — Settings close only via Save/Cancel; info still dismisses on outside click / Escape.
- [x] **UX001-4** — Gear/info bar alignment; **+** FAB glossy periwinkle disc.
- [x] **UX001-5** — Louder, slightly longer web chime; mobile haptic parity.
- [x] **UX001-6** — Unit tests, UAT, README for this epic.

---

## Epic: Security scan and fix (`SC001`)

Run this before GitHub Pages go-live and before any store build. **Scan → triage → fix → re-scan** until the list is empty or accepted.

### How to scan

- [ ] **SC001-1** — Cursor security review — In this repo, run `/review-security` (or ask the agent for a security review of branch / uncommitted changes). Capture findings in a short list (severity, file, issue).
- [ ] **SC001-2** — Dependency audit — `cd apps/mobile && npm audit --omit=dev`. Treat **high/critical** as blockers. Recheck after `npm audit fix` (no force unless you understand the break).
- [ ] **SC001-3** — Secret scan — Search the tree for keys, tokens, `.env`, Play/App Store JSON, `google-services.json`, `AuthKey_*.p8`. Nothing of that belongs in git. Confirm `.gitignore` covers `node_modules/`, `.expo/`, `*.jks`, `credentials.json`.
- [ ] **SC001-4** — Web threat pass (static Pages app) — Check:
  - Stats / timer labels are **text**, never `innerHTML` with user strings (XSS).
  - `PUT /data/state.json` exists only on the local `dev/serve.py`; Pages must not accept writes from the internet.
  - Persist is **device-local** (`localStorage` / AsyncStorage); no account, no analytics SDK, no third-party script tags.
  - Chime / timer audio starts only after a **user gesture**.
- [ ] **SC001-5** — Mobile threat pass — Check:
  - No `http://` API calls (this app should have none).
  - Vibration / audio used only for the chime/timer; declare them honestly in store listings.
  - Deep links / Expo `scheme` not left as a default that another app could abuse.
  - `npx expo-doctor` in `apps/mobile` is clean enough to ship.

### How to address

- [ ] **SC001-6** — Triage — For each finding: **fix now**, **wontfix** (write why), or **defer** (ticket + date). High/critical and anything that leaks data off-device = fix now.
- [ ] **SC001-7** — Fix — Patch in the smallest change; add a unit test if the bug was logic (clamps, parse, persist). Do not add a framework to “be more secure.”
- [ ] **SC001-8** — Re-scan — Repeat SC001-1–SC001-5 on the same diff. Ship only when new findings are wontfix/defer.
- [ ] **SC001-9** — UAT — Add **Feature name: Security** to `user_acceptance_testing.md` (localhost + Pages + mobile): no console errors from blocked mixed content; settings save locally; after refresh, data is still only on that browser/device.

Cadence: once before first store submit; again after any new dependency or persist change.

---

## Epic: Android Play Store (`AN001`)

Expo app in `apps/mobile`. Use **EAS Build** so you do not maintain a local Android Studio release pipeline unless you want to.

### One-time setup

- [ ] **AN001-1** — Google Play Console account (developer identity, one-time Play fee).
- [ ] **AN001-2** — Expo account; in `apps/mobile`: `npx eas-cli login` then `npx eas-cli init` (link project).
- [ ] **AN001-3** — Set a unique **applicationId** (e.g. `xyz.githubio.decisive`) in `app.json` → `expo.android.package`. Do not change it after the first store upload.
- [ ] **AN001-4** — Store assets: 1024 adaptive icon, splash, feature graphic 1024×500. Dark background `#0c0d14` to match the app.
- [ ] **AN001-5** — Privacy: short policy page (GitHub Pages is enough) stating **no accounts, no tracking, data stays on device**. Play Console → App content → Privacy policy URL.
- [ ] **AN001-6** — Data safety form: no collected data / no sharing (AsyncStorage never leaves the phone).
- [ ] **AN001-7** — Finish **SC001** on the commit you will build.

### Build and upload

- [ ] **AN001-8** — `eas.json` profiles: `preview` (internal APK/AAB) and `production` (AAB, Play).
- [ ] **AN001-9** — `npx eas-cli build --platform android --profile preview` — install on a physical phone; run mobile UAT (all four widgets, persist, chime).
- [ ] **AN001-10** — `npx eas-cli build --platform android --profile production` — download the **AAB**.
- [ ] **AN001-11** — Play Console → create app “Decisive” → **Internal testing** track → upload AAB → add testers → smoke on a real device.
- [ ] **AN001-12** — Store listing: title, short/full description, screenshots (phone), content rating (likely Everyone; no user-generated public posts).
- [ ] **AN001-13** — Promote Internal → **Closed** (optional) → **Production**. Submit for review.
- [ ] **AN001-14** — After live: tag git `android-1.0.0`; bump `expo.version` / `android.versionCode` for the next upload.

**UAT:** Feature name: Android Play — install from Internal testing, not Expo Go; widgets, persist, chime/vibration.

---

## Epic: iOS App Store (`IO001`)

Requires an **Apple Developer Program** membership ($99/year). Builds can run on EAS cloud; you still need App Store Connect. A Mac is optional if EAS Submit handles the IPA.

### One-time setup

- [ ] **IO001-1** — Enroll at [developer.apple.com](https://developer.apple.com) → wait for activation.
- [ ] **IO001-2** — App Store Connect → Users: your Apple ID can create apps.
- [ ] **IO001-3** — Bundle ID (e.g. `xyz.githubio.decisive`) in `app.json` → `expo.ios.bundleIdentifier`. Permanent after first upload.
- [ ] **IO001-4** — EAS: `npx eas-cli build --platform ios` will prompt to create a distribution cert + provisioning profile (let EAS manage credentials unless you already have them).
- [ ] **IO001-5** — Same icon/splash as Android; iOS also wants 1024×1024 App Store icon (no alpha).
- [ ] **IO001-6** — Privacy policy URL (same Pages URL as AN001-5). App Privacy questionnaire: **no data collected**.
- [ ] **IO001-7** — Finish **SC001** on the commit you will build.

### Build, TestFlight, ship

- [ ] **IO001-8** — `npx eas-cli build --platform ios --profile preview` — install via QR / internal distribution if configured, or skip to production + TestFlight.
- [ ] **IO001-9** — `npx eas-cli build --platform ios --profile production` — produces an **.ipa** (or lets EAS submit).
- [ ] **IO001-10** — App Store Connect → New App → iOS → select the bundle ID → upload IPA (`npx eas-cli submit --platform ios` or Transporter).
- [ ] **IO001-11** — **TestFlight**: add internal testers (same Apple ID team) → install on a physical iPhone → run mobile UAT (timers, stats, chime; Background audio if you enable it later).
- [ ] **IO001-12** — Listing: name, subtitle, description, keywords, screenshots for 6.7" and 6.1" iPhones (required sizes change; follow current App Store Connect checklist). Support URL + marketing URL can be the GitHub Pages site.
- [ ] **IO001-13** — Age rating, review notes (“local athletic drill widgets, no login”), demo account = none.
- [ ] **IO001-14** — Submit for App Review. Fix any Guideline 2.1 / 4.2 / 5.1.1 issues (incomplete app, WebView-only, privacy). This app is native Expo, not a wrapped website — say so in notes.
- [ ] **IO001-15** — After Approved + Release: tag git `ios-1.0.0`; bump `expo.version` / `ios.buildNumber` for the next build.

### iOS-only gotchas

- Physical device needed for TestFlight; Simulator is not a store test.
- Chime may be silent until the user allows sound; document in the listing.
- If review asks for encryption: HTTPS-only / no custom crypto → standard **exempt** encryption answer (no extra export form for this app).

**UAT:** Feature name: iOS App Store — TestFlight build, not Expo Go.

---

## Suggested build order

Do **FO001 → WS001 → CC001**, then **IC001 / TM001 / ST001** in any order (colour is the existing product). Finish **DP001** as each feature lands, not as a dump at the end. **SC001** before every store or public Pages push. **AN001** then **IO001** (Android fee is lower friction; iOS needs the paid Apple program). **UX001** is polish on the live board.

```
FO001 Foundation
WS001 Widget shell (picker, grid, expand, drag, remove, max 4)
CC001 Color change (port + elegant palette + settings)
IC001 Interval chime
TM001 Time (timer / stopwatch sub-widgets)
ST001 Stats (statsN + 10 key/value)
DP001 Pages + mobile parity (ongoing)
UX001 Board UX (info, color pickers, chrome)
SC001 Security scan → fix → re-scan
AN001 Android Play Store (EAS + Play Console)
IO001 iOS App Store (EAS + TestFlight + Review)
RM001 Epic/task commit format (process)
```

---

## Done when

- User can add any subset of the 4 widgets, lay them out, expand one to a phone-sized screen, set it with gear, shrink it back, drag to reorder, remove with a themed confirm.
- Colour, chime, and clocks keep working together.
- One JSON is the source of truth.
- Each feature is unit-tested where logic exists, has a mobile screen, and has UAT for localhost, github.io, and the app.
- Security scan (SC001) is clean or explicitly wontfix’d before a public release.
- Android is on Play (internal testing at minimum); iOS is on TestFlight at minimum, Production when review passes.
- New work is a checked epic task; commits start with `<EPIC_CODE>-<TASK>`.
