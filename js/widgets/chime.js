import { chimeChangeLabel, chimeSettingsErrors, formatChimeEta, nextChimeDelayMs } from "../logic/chime.js";
import { formatDelaySec, parseNum } from "../logic/delay.js";
import { delayField } from "../step-field.js";
import { openForm } from "../dialog.js";
import { phEl, setPh } from "../icons.js";
import { audioBlocked, playChime, unlockAudio } from "../sound.js";

export function mountChime(body, ctx) {
  const face = document.createElement("div");
  face.className = "chime-face";
  const note = document.createElement("div");
  note.className = "chime-note";
  note.append(phEl("music-note"));
  const eta = document.createElement("div");
  eta.className = "chime-eta";
  const toggle = document.createElement("button");
  toggle.className = "icon-btn chime-toggle";
  toggle.type = "button";
  const toggleIcon = phEl("pause");
  toggle.append(toggleIcon);
  const unlock = document.createElement("button");
  unlock.className = "btn chime-unlock";
  unlock.type = "button";
  unlock.textContent = "Tap to enable sound";
  face.append(note, eta, toggle, unlock);
  body.append(face);

  let timer = 0;
  let tick = 0;
  let dueAt = 0;
  let paused = false;
  let remaining = 0;

  function showUnlock() {
    unlock.hidden = !audioBlocked();
  }

  unlock.onclick = async () => {
    await unlockAudio();
    showUnlock();
  };

  function paintToggle() {
    setPh(toggleIcon, paused ? "play" : "pause");
    toggle.setAttribute("aria-label", paused ? "Resume" : "Pause");
    face.classList.toggle("is-paused", paused);
  }

  function leftMs() {
    return paused ? remaining : Math.max(0, dueAt - Date.now());
  }

  function onChime() {
    if (paused) return;
    face.classList.remove("is-hit");
    void face.offsetWidth;
    face.classList.add("is-hit");
    (async () => {
      if (audioBlocked()) await unlockAudio();
      playChime();
    })();
    schedule();
  }

  function schedule(fromMs) {
    clearTimeout(timer);
    if (paused) return;
    const ms = fromMs != null ? Math.max(0, fromMs) : Math.max(80, nextChimeDelayMs(ctx.get()));
    dueAt = Date.now() + ms;
    timer = setTimeout(onChime, ms);
  }

  function setPaused(next) {
    if (next === paused) return;
    if (next) {
      remaining = leftMs();
      paused = true;
      clearTimeout(timer);
    } else {
      const ms = remaining;
      paused = false;
      remaining = 0;
      schedule(ms);
    }
    paintToggle();
    paintEta();
  }

  toggle.onclick = () => setPaused(!paused);

  function paintEta() {
    eta.textContent = formatChimeEta(leftMs(), paused);
    showUnlock();
  }

  paintToggle();
  schedule();
  paintEta();
  tick = setInterval(paintEta, 250);

  return {
    destroy() {
      clearTimeout(timer);
      clearInterval(tick);
    },
    async openSettings() {
      const cur = ctx.get();
      const values = await openForm({
        title: "Interval chime",
        build(el, ui) {
          const seg = document.createElement("div");
          seg.className = "seg";
          const fixedBtn = document.createElement("button");
          fixedBtn.type = "button";
          fixedBtn.textContent = "Fixed";
          const randBtn = document.createElement("button");
          randBtn.type = "button";
          randBtn.textContent = "Random";
          seg.append(fixedBtn, randBtn);
          let mode = cur.mode === "random" ? "random" : "fixed";
          const paintSeg = () => {
            fixedBtn.className = mode === "fixed" ? "is-on" : "";
            randBtn.className = mode === "random" ? "is-on" : "";
            fixedWrap.hidden = mode !== "fixed";
            randWrap.hidden = mode !== "random";
            sync();
          };
          fixedBtn.onclick = () => { mode = "fixed"; paintSeg(); };
          randBtn.onclick = () => { mode = "random"; paintSeg(); };

          const everyL = document.createElement("label");
          everyL.className = "field";
          everyL.htmlFor = "ch-fixed";
          everyL.textContent = "Every (s)";
          const fi = delayField("ch-fixed", formatDelaySec(cur.fixed));
          const fixedWrap = document.createElement("div");
          fixedWrap.append(everyL, fi.wrap);

          const minL = document.createElement("label");
          minL.className = "field";
          minL.htmlFor = "ch-lo";
          minL.textContent = "Min (s)";
          const maxL = document.createElement("label");
          maxL.className = "field";
          maxL.htmlFor = "ch-hi";
          maxL.textContent = "Max (s)";
          const lo = delayField("ch-lo", formatDelaySec(cur.lo));
          const hi = delayField("ch-hi", formatDelaySec(cur.hi));
          const randWrap = document.createElement("div");
          randWrap.append(minL, lo.wrap, maxL, hi.wrap);

          const notes = document.createElement("div");

          function draft() {
            return { mode, fixed: fi.value, lo: lo.value, hi: hi.value };
          }

          function sync() {
            const errors = chimeSettingsErrors(draft());
            notes.replaceChildren();
            if (errors.length) {
              errors.forEach((msg) => {
                const p = document.createElement("p");
                p.className = "hint hint-err";
                p.textContent = msg;
                notes.append(p);
              });
            } else {
              const p = document.createElement("p");
              p.className = "hint";
              const a = parseNum(fi.value);
              const b = parseNum(lo.value);
              const c = parseNum(hi.value);
              p.textContent = chimeChangeLabel(mode, a, b, c);
              notes.append(p);
            }
            if (ui && ui.setSaveEnabled) ui.setSaveEnabled(!errors.length);
          }

          fi.oninput = lo.oninput = hi.oninput = sync;
          el.append(seg, fixedWrap, randWrap, notes);
          paintSeg();
          return () => ({
            mode,
            fixed: parseNum(fi.value),
            lo: parseNum(lo.value),
            hi: parseNum(hi.value)
          });
        }
      });
      if (values) {
        ctx.set(values);
        paused = false;
        remaining = 0;
        paintToggle();
        schedule();
      }
    }
  };
}
