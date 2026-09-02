import { clampChimeSec, formatChimeEta, nextChimeDelayMs } from "../logic/chime.js";
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
    const ms = fromMs != null ? Math.max(0, fromMs) : Math.max(1000, nextChimeDelayMs(ctx.get()));
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
        build(el) {
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
          };
          fixedBtn.onclick = () => { mode = "fixed"; paintSeg(); };
          randBtn.onclick = () => { mode = "random"; paintSeg(); };

          const fixedWrap = document.createElement("div");
          const fl = document.createElement("label");
          fl.className = "field";
          fl.textContent = "Every N seconds (1–900)";
          const fi = document.createElement("input");
          fi.type = "number";
          fi.min = "1";
          fi.max = "900";
          fi.value = String(cur.fixed);
          fixedWrap.append(fl, fi);

          const randWrap = document.createElement("div");
          const ll = document.createElement("label");
          ll.className = "field";
          ll.textContent = "Random lower (s)";
          const lo = document.createElement("input");
          lo.type = "number";
          lo.min = "1";
          lo.max = "900";
          lo.value = String(cur.lo);
          const hl = document.createElement("label");
          hl.className = "field";
          hl.textContent = "Random upper (s)";
          const hi = document.createElement("input");
          hi.type = "number";
          hi.min = "1";
          hi.max = "900";
          hi.value = String(cur.hi);
          randWrap.append(ll, lo, hl, hi);

          el.append(seg, fixedWrap, randWrap);
          paintSeg();
          return () => ({
            mode,
            fixed: clampChimeSec(fi.value, 30),
            lo: clampChimeSec(lo.value, 5),
            hi: clampChimeSec(hi.value, 10)
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
