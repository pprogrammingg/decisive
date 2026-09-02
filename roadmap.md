# Decisive roadmap

Athletic decision-making drills. The home screen is a **widget grid** (max 4). Each widget is a specialized screen. Widgets run at the same time. State lives in one shared JSON file.

Web stays **HTML, CSS, and vanilla JS** — no framework, no bundler unless GitHub Pages or tests force a tiny helper. Split files and keep them refactored. Mobile follows the Expo pattern in `../sub_zero`.

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
  "layout": { "order": ["color", "chime"] },
  "color": { "count": 3, "delayLo": 2, "delayHi": 6 },
  "chime": { "mode": "random", "lo": 5, "hi": 10 },
  "time": { "items": [] },
  "stats": { "items": [] }
}
```

---

## Phase 0 — Foundation

Shared chrome so widgets do not invent their own dialogs, theme, or persist.

- [x] **0.1 Theme** — CSS tokens: coral, periwinkle, magenta, ink, glow. High energy, not toy-orange. Widget borders, grid gap, full-screen vs cell.
- [x] **0.2 Split the current `index.html`** — HTML shell + CSS files + JS modules. Colour cycle still works. No behaviour loss.
- [x] **0.3 Dialog system** — One confirm (delete / save settings) and one settings panel. Same overlay, type, buttons, motion. Reuse for every later dialog.
- [x] **0.4 Store** — `load()` / `save()` against shared JSON. Widgets read only their key. Safe defaults if a key is missing.
- [x] **0.5 Test harness** — Extract pure functions; unit tests in `tests/logic.test.js`.
- [x] **0.6 UAT file** — Create `user_acceptance_testing.md` with the section format below.
- [x] **0.7 Mobile scaffold** — `apps/mobile` Expo app like `../sub_zero`: shared state shape, AsyncStorage persist, one home screen stub.

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

## Phase 1 — Widget shell

Home is an empty (or colour-only) board plus the add control.

### 1.1 Home + add picker

- [x] Circle **+** fixed bottom-left (safe-area aware).
- [x] Click opens dialog listing the four types, each with icon + short text:
  1. Color change
  2. Interval chime
  3. Time (timer / stopwatch)
  4. Stats
- [x] Already added: slightly dimmer, **green check**.
- [x] Available: full colour, **blue/white add** circle (not a check).
- [x] Can toggle several in one sitting; **Save** commits; already-at-4 types stay checked and cannot add duplicates.
- [x] Max 4 widgets total — picker refuses a fifth type if 4 are present.

### 1.2 Grid + expand / contract

- [x] Each widget: chrome with **expand/contract arrow**.
- [x] Full: ~mobile viewport, gear visible, settings via gear.
- [x] Shrunk: cell in the grid; gear hidden.
- [x] 2 widgets → 2-cell grid. 3 → 3 cells. 4 → 2×2. Empty cells do not show.

### 1.3 Remove + drag

- [x] Remove control on a widget; **confirm** dialog before delete; Save settings also uses the same confirm family.
- [x] Drag a widget onto another cell: swap / push so order stays a simple list.
- [x] Persist `layout.order` after add, remove, drag.

### 1.4 Simultaneous runtime

- [x] A tiny scheduler (or per-widget timers) so shrunk widgets keep ticking (colour, chime, clocks).

**UAT:** Widget shell (add picker, grid counts, expand, remove confirm, drag, max 4).

---

## Phase 2 — Widget 1: Color change

Most of this already lives in `index.html`. Wrap it as a widget; do not rewrite the delay math without tests.

- [x] Mount existing cycle inside the colour widget (full + shrunk: fill the widget, not the whole page when other widgets exist).
- [x] Palette: **coral, periwinkle, magenta**, plus a few elegant companions (not harsh orange/lime). Keep enough contrast for drills.
- [x] Gear (full-screen only): colour count (2–6) and random delay range — same idea as today, restyled to the dialog system.
- [x] Confirm on save settings.
- [x] Unit tests: keep / port delay-bound tests; add palette-count clamp.
- [x] Mobile: same cycle + settings.
- [x] **UAT:** Color change

---

## Phase 3 — Widget 2: Interval sound chime

A chime on a timer. Runs even when the widget is shrunk.

- [x] Gear: **fixed** every N seconds, or **random** between lo–hi. Range **1–900 s**.
- [x] Random example: 5–10 s → chime at 7s, then 6s, then 10s, then 5s (new draw after each chime).
- [x] Short, clear chime (Web Audio or a tiny bundled sound). Respect autoplay: start after a user gesture if the browser blocks it; show a quiet “tap to enable sound” in the widget if needed.
- [x] Confirm on save settings.
- [x] Unit tests: clamp 1–900, fixed vs random next-delay.
- [x] Mobile: `Audio` / Expo AV; same settings.
- [x] **UAT:** Interval sound chime

---

## Phase 4 — Widget 3: Time

The time widget is a **list of sub-widgets** (max **5**). Types: **timer** and **stopwatch**. Look and feel follow Android Clock: timer (digits, start/pause/reset, +1:00) and stopwatch (run, lap, reset; **laps hidden behind a Laps button** that opens a history sheet).

- [x] Rows: add sub-widget → pick timer or stopwatch. Cap at 5.
- [x] Tap a row → expand that sub-widget to the widget’s full area to set / run it. Back returns to the row list.
- [x] Stopwatch: laps panel closed by default; Laps opens history.
- [x] Remove a sub-widget via confirm.
- [x] Persist each sub-widget (type, remaining/elapsed, laps, running flag — restore reasonably on reload).
- [x] Unit tests: tick math, lap list, max-5.
- [x] Mobile: same Android-like layout (RN views, not a WebView of the page).
- [x] **UAT:** Time widget

---

## Phase 5 — Widget 4: Stats

Field notes: last name, first name, keep-ups, sprint speed, etc.

- [x] Max **5** sub-widgets. Each add creates a button `stats1` … `stats5`.
- [x] Tap a button → panel with **10 key inputs** and **10 value inputs**.
- [x] Persist keys/values per stats slot.
- [x] Remove slot via confirm; renumber labels if needed (keep it obvious: `stats1`… in list order).
- [x] Unit tests: max 5, 10 pairs, empty keys ignored on save.
- [x] Mobile: same buttons + 10×2 fields.
- [x] **UAT:** Stats

---

## Phase 6 — Deploy + parity

- [x] GitHub Pages (`github.io`): static web root; persist via localStorage if PUT is unavailable, same JSON shape.
- [x] Widgets still simultaneous on Pages.
- [x] Fill UAT **GitHub Pages** steps for every feature shipped.
- [x] Mobile UAT for every feature; store on device (AsyncStorage), same schema.

---

## Phase 7 — Security scan and fix

Run this before GitHub Pages go-live and before any store build. **Scan → triage → fix → re-scan** until the list is empty or accepted.

### How to scan

- [ ] **7.1 Cursor security review** — In this repo, run `/review-security` (or ask the agent for a security review of branch / uncommitted changes). Capture findings in a short list (severity, file, issue).
- [ ] **7.2 Dependency audit** — `cd apps/mobile && npm audit --omit=dev`. Treat **high/critical** as blockers. Recheck after `npm audit fix` (no force unless you understand the break).
- [ ] **7.3 Secret scan** — Search the tree for keys, tokens, `.env`, Play/App Store JSON, `google-services.json`, `AuthKey_*.p8`. Nothing of that belongs in git. Confirm `.gitignore` covers `node_modules/`, `.expo/`, `*.jks`, `credentials.json`.
- [ ] **7.4 Web threat pass** (static Pages app) — Check:
  - Stats / timer labels are **text**, never `innerHTML` with user strings (XSS).
  - `PUT /data/state.json` exists only on the local `dev/serve.py`; Pages must not accept writes from the internet.
  - Persist is **device-local** (`localStorage` / AsyncStorage); no account, no analytics SDK, no third-party script tags.
  - Chime / timer audio starts only after a **user gesture**.
- [ ] **7.5 Mobile threat pass** — Check:
  - No `http://` API calls (this app should have none).
  - Vibration / audio used only for the chime/timer; declare them honestly in store listings.
  - Deep links / Expo `scheme` not left as a default that another app could abuse.
  - `npx expo-doctor` in `apps/mobile` is clean enough to ship.

### How to address

- [ ] **7.6 Triage** — For each finding: **fix now**, **wontfix** (write why), or **defer** (ticket + date). High/critical and anything that leaks data off-device = fix now.
- [ ] **7.7 Fix** — Patch in the smallest change; add a unit test if the bug was logic (clamps, parse, persist). Do not add a framework to “be more secure.”
- [ ] **7.8 Re-scan** — Repeat 7.1–7.5 on the same diff. Ship only when new findings are wontfix/defer.
- [ ] **7.9 UAT** — Add **Feature name: Security** to `user_acceptance_testing.md` (localhost + Pages + mobile): no console errors from blocked mixed content; settings save locally; after refresh, data is still only on that browser/device.

Cadence: once before first store submit; again after any new dependency or persist change.

---

## Phase 8 — Android release (Play Store)

Expo app in `apps/mobile`. Use **EAS Build** so you do not maintain a local Android Studio release pipeline unless you want to.

### One-time setup

- [ ] **8.1** Google Play Console account (developer identity, one-time Play fee).
- [ ] **8.2** Expo account; in `apps/mobile`: `npx eas-cli login` then `npx eas-cli init` (link project).
- [ ] **8.3** Set a unique **applicationId** (e.g. `xyz.githubio.decisive`) in `app.json` → `expo.android.package`. Do not change it after the first store upload.
- [ ] **8.4** Store assets: 1024 adaptive icon, splash, feature graphic 1024×500. Dark background `#0c0d14` to match the app.
- [ ] **8.5** Privacy: short policy page (GitHub Pages is enough) stating **no accounts, no tracking, data stays on device**. Play Console → App content → Privacy policy URL.
- [ ] **8.6** Data safety form: no collected data / no sharing (AsyncStorage never leaves the phone).
- [ ] **8.7** Finish **Phase 7** on the commit you will build.

### Build and upload

- [ ] **8.8** `eas.json` profiles: `preview` (internal APK/AAB) and `production` (AAB, Play).
- [ ] **8.9** `npx eas-cli build --platform android --profile preview` — install on a physical phone; run mobile UAT (all four widgets, persist, chime).
- [ ] **8.10** `npx eas-cli build --platform android --profile production` — download the **AAB**.
- [ ] **8.11** Play Console → create app “Decisive” → **Internal testing** track → upload AAB → add testers → smoke on a real device.
- [ ] **8.12** Store listing: title, short/full description, screenshots (phone), content rating (likely Everyone; no user-generated public posts).
- [ ] **8.13** Promote Internal → **Closed** (optional) → **Production**. Submit for review.
- [ ] **8.14** After live: tag git `android-1.0.0`; bump `expo.version` / `android.versionCode` for the next upload.

**UAT:** Feature name: Android Play — install from Internal testing, not Expo Go; widgets, persist, chime/vibration.

---

## Phase 9 — iOS release (App Store)

Requires an **Apple Developer Program** membership ($99/year). Builds can run on EAS cloud; you still need App Store Connect. A Mac is optional if EAS Submit handles the IPA.

### One-time setup

- [ ] **9.1** Enroll at [developer.apple.com](https://developer.apple.com) → wait for activation.
- [ ] **9.2** App Store Connect → Users: your Apple ID can create apps.
- [ ] **9.3** Bundle ID (e.g. `xyz.githubio.decisive`) in `app.json` → `expo.ios.bundleIdentifier`. Permanent after first upload.
- [ ] **9.4** EAS: `npx eas-cli build --platform ios` will prompt to create a distribution cert + provisioning profile (let EAS manage credentials unless you already have them).
- [ ] **9.5** Same icon/splash as Android; iOS also wants 1024×1024 App Store icon (no alpha).
- [ ] **9.6** Privacy policy URL (same Pages URL as 8.5). App Privacy questionnaire: **no data collected**.
- [ ] **9.7** Finish **Phase 7** on the commit you will build.

### Build, TestFlight, ship

- [ ] **9.8** `npx eas-cli build --platform ios --profile preview` — install via QR / internal distribution if configured, or skip to production + TestFlight.
- [ ] **9.9** `npx eas-cli build --platform ios --profile production` — produces an **.ipa** (or lets EAS submit).
- [ ] **9.10** App Store Connect → New App → iOS → select the bundle ID → upload IPA (`npx eas-cli submit --platform ios` or Transporter).
- [ ] **9.11** **TestFlight**: add internal testers (same Apple ID team) → install on a physical iPhone → run mobile UAT (timers, stats, chime; Background audio if you enable it later).
- [ ] **9.12** Listing: name, subtitle, description, keywords, screenshots for 6.7" and 6.1" iPhones (required sizes change; follow current App Store Connect checklist). Support URL + marketing URL can be the GitHub Pages site.
- [ ] **9.13** Age rating, review notes (“local athletic drill widgets, no login”), demo account = none.
- [ ] **9.14** Submit for App Review. Fix any Guideline 2.1 / 4.2 / 5.1.1 issues (incomplete app, WebView-only, privacy). This app is native Expo, not a wrapped website — say so in notes.
- [ ] **9.15** After Approved + Release: tag git `ios-1.0.0`; bump `expo.version` / `ios.buildNumber` for the next build.

### iOS-only gotchas

- Physical device needed for TestFlight; Simulator is not a store test.
- Chime may be silent until the user allows sound; document in the listing.
- If review asks for encryption: HTTPS-only / no custom crypto → standard **exempt** encryption answer (no extra export form for this app).

**UAT:** Feature name: iOS App Store — TestFlight build, not Expo Go.

---

## Suggested build order

Do **0 → 1 → 2**, then **3 / 4 / 5** in any order (colour is the existing product). Finish **6** as each feature lands, not as a dump at the end. **7** before every store or public Pages push. **8** then **9** (Android fee is lower friction; iOS needs the paid Apple program).

```
0 Foundation
1 Widget shell (picker, grid, expand, drag, remove, max 4)
2 Color change (port + elegant palette + settings)
3 Interval chime
4 Time (timer / stopwatch sub-widgets)
5 Stats (statsN + 10 key/value)
6 Pages + mobile parity (ongoing)
7 Security scan → fix → re-scan
8 Android Play Store (EAS + Play Console)
9 iOS App Store (EAS + TestFlight + Review)
```

---

## Done when

- User can add any subset of the 4 widgets, lay them out, expand one to a phone-sized screen, set it with gear, shrink it back, drag to reorder, remove with a themed confirm.
- Colour, chime, and clocks keep working together.
- One JSON is the source of truth.
- Each feature is unit-tested where logic exists, has a mobile screen, and has UAT for localhost, github.io, and the app.
- Security scan (Phase 7) is clean or explicitly wontfix’d before a public release.
- Android is on Play (internal testing at minimum); iOS is on TestFlight at minimum, Production when review passes.
