# Decisive

Single-file web page (`index.html`) that fills the screen with colors from a small palette, then switches to a new random color after a random delay. Built to stay tiny: no build step, no dependencies, works in mobile browsers.

## What it does

- The **whole viewport** is the background color. On each tick, the app picks a **random color** from the active pool (the same color can repeat).
- A **⚙** button sits in the **top-right**. Tap it to open settings; tap the dimmed area outside to close.
- **Colors in pool** (slider **2–6**, default **3**): the pool is the first *N* colors in fixed order: red, green, white, light blue, black, grey. The slider only changes how many of those are in play.
- **Randomize time delay range**: lower and upper bounds in **seconds** (inputs accept decimals, clamped to **0.5–5** when a value is present).
  - **Both blank**: effective range **1–3 s** (internal defaults 3 and 1 are swapped into order).
  - **Only lower filled**: upper is treated as **5 s** until you set an upper bound.
  - **Only upper filled**: lower is treated as **0.5 s** until you set a lower bound.
  - **Both filled**: each side is clamped; if lower would be greater than upper, the two are **swapped**.
- A line under those fields always shows the **final delay range** used for the next random wait (e.g. `Final delay: 2–5 s`).
- After each color (including the first), the app waits a **uniform random** time in that range, then picks the next color again.
- On **white** or **grey** backgrounds, the gear control switches to a **dark pill** and **light icon** so it stays visible.

## How to run

Open `index.html` in a browser (file or any static host). For a quick local server:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8080/` in that directory.

## Repo layout

- `index.html` — the entire app.
- `tests/` — optional Python tests for delay-bound logic (listed in `.gitignore` so they are not tracked by default).
