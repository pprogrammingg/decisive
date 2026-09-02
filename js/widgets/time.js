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
  msToHms,
  pauseItem,
  renameTimeItem,
  resetItem,
  setTimerDuration,
  startItem,
  TIME_NAME_MAX,
  timeDisplayName
} from "../logic/time.js";
import { openChoices, openConfirm } from "../dialog.js";
import { playDone, unlockAudio } from "../sound.js";

function btn(cls, text) {
  const b = document.createElement("button");
  b.className = cls;
  b.type = "button";
  b.textContent = text;
  return b;
}

export function mountTime(body, ctx) {
  const listFace = document.createElement("div");
  listFace.className = "list-face";
  const scroll = document.createElement("div");
  scroll.className = "list-scroll";
  listFace.append(scroll);

  const detail = document.createElement("div");
  detail.className = "detail-face";
  detail.hidden = true;

  body.append(listFace, detail);

  let openId = null;
  let raf = 0;
  let lastTimerZero = new Set();
  let editingId = null;

  function items() {
    return ctx.get().items || [];
  }

  function patchItems(next) {
    ctx.set({ items: next });
  }

  function updateItem(id, fn) {
    patchItems(items().map((it) => (it.id === id ? fn(it) : it)));
  }

  function listView() {
    openId = null;
    detail.hidden = true;
    listFace.hidden = false;
    renderList();
  }

  function renderList() {
    if (editingId) return;
    scroll.replaceChildren();
    items().forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "row-btn";
      const nameBtn = btn("time-name", timeDisplayName(it, i));
      nameBtn.title = "Tap to rename";
      nameBtn.onclick = () => startRename(nameBtn, it, i);
      const openBtn = btn("time-open", "");
      openBtn.setAttribute("aria-label", "Open " + timeDisplayName(it, i));
      openBtn.title = "Double-click to open";
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.dataset.id = it.id;
      openBtn.append(meta);
      openBtn.ondblclick = () => openDetail(it.id);
      const trash = btn("icon-btn", "✕");
      trash.onclick = async () => {
        const ok = await openConfirm({
          title: "Remove",
          message: "Delete this timer / stopwatch?",
          okText: "Remove",
          danger: true
        });
        if (!ok) return;
        if (openId === it.id) listView();
        patchItems(items().filter((x) => x.id !== it.id));
        renderList();
      };
      row.append(nameBtn, openBtn, trash);
      scroll.append(row);
    });
    if (canAddTimeItem(items())) {
      const add = btn("add-row", "+ Add timer or stopwatch");
      add.onclick = async () => {
        const type = await openChoices({
          title: "Add",
          message: "Timer or stopwatch — max 5.",
          choices: [
            { label: "Timer", value: "timer" },
            { label: "Stopwatch", value: "stopwatch" }
          ]
        });
        if (!type) return;
        patchItems(addTimeItem(items(), type));
        renderList();
      };
      scroll.append(add);
    }
  }

  function startRename(nameBtn, it, index) {
    editingId = it.id;
    const input = document.createElement("input");
    input.className = "time-name-input";
    input.type = "text";
    input.maxLength = String(TIME_NAME_MAX);
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = timeDisplayName(it, index);
    input.setAttribute("aria-label", "Clock name");
    nameBtn.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      editingId = null;
      if (save) patchItems(renameTimeItem(items(), it.id, input.value));
      else renderList();
    };
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
  }

  function openDetail(id) {
    openId = id;
    listFace.hidden = true;
    detail.hidden = false;
    paintDetail();
  }

  function paintDetail() {
    const it = items().find((x) => x.id === openId);
    if (!it) {
      listView();
      return;
    }
    detail.replaceChildren();
    const top = document.createElement("div");
    top.className = "detail-top";
    const back = btn("btn btn-ghost", "←");
    back.onclick = listView;
    const heading = document.createElement("div");
    heading.className = "detail-name";
    const list = items();
    heading.textContent = timeDisplayName(it, list.findIndex((x) => x.id === it.id));
    top.append(back, heading);
    const clock = document.createElement("div");
    clock.className = "clock";
    const digits = document.createElement("div");
    digits.className = "digits";
    const actions = document.createElement("div");
    actions.className = "actions";
    clock.append(digits, actions);
    detail.append(top, clock);

    if (it.type === "timer") {
      const hms = document.createElement("div");
      hms.className = "hms";
      const h = document.createElement("input");
      const m = document.createElement("input");
      const s = document.createElement("input");
      [h, m, s].forEach((inp) => { inp.type = "number"; inp.min = "0"; });
      m.max = s.max = "59";
      const cur = msToHms(it.durationMs || it.remainingMs || 0);
      h.value = cur.h;
      m.value = cur.m;
      s.value = cur.s;
      const wrap = (inp, lab) => {
        const l = document.createElement("label");
        l.textContent = lab;
        l.append(inp);
        return l;
      };
      hms.append(wrap(h, "h"), wrap(m, "m"), wrap(s, "s"));
      clock.insertBefore(hms, digits);
      const applyDur = () => {
        if (items().find((x) => x.id === it.id)?.running) return;
        updateItem(it.id, (x) => setTimerDuration(x, hmsToMs(+h.value || 0, +m.value || 0, +s.value || 0)));
      };
      h.oninput = m.oninput = s.oninput = applyDur;

      const start = btn("btn btn-go", "Start");
      const pause = btn("btn btn-pause", "Pause");
      const reset = btn("btn btn-ghost", "Reset");
      const plus = btn("btn btn-ghost", "+1:00");
      start.onclick = async () => {
        await unlockAudio();
        applyDur();
        updateItem(it.id, (x) => startItem(x));
      };
      pause.onclick = () => updateItem(it.id, (x) => pauseItem(x));
      reset.onclick = () => updateItem(it.id, resetItem);
      plus.onclick = () => updateItem(it.id, (x) => addMinute(x));
      actions.append(start, pause, reset, plus);
    } else {
      clock.classList.add("is-sw");
      const start = btn("btn btn-go", "Start");
      const pause = btn("btn btn-pause", "Pause");
      const reset = btn("btn btn-ghost", "Reset");
      const lap = btn("btn btn-ghost", "Lap");
      start.onclick = () => updateItem(it.id, (x) => startItem(x));
      pause.onclick = () => updateItem(it.id, (x) => pauseItem(x));
      reset.onclick = () => updateItem(it.id, resetItem);
      lap.onclick = () => updateItem(it.id, (x) => addLap(x));
      actions.append(start, pause, lap, reset);
      const grid = document.createElement("div");
      grid.className = "lap-grid";
      for (let i = 0; i < MAX_LAPS; i++) {
        const cell = document.createElement("div");
        cell.className = "lap-cell";
        const n = document.createElement("span");
        n.className = "lap-n";
        n.textContent = String(i + 1);
        const t = document.createElement("span");
        t.className = "lap-t";
        cell.append(n, t);
        grid.append(cell);
      }
      clock.append(grid);
    }
  }

  function tickDisplay() {
    const now = Date.now();
    scroll.querySelectorAll(".meta[data-id]").forEach((node) => {
      const it = items().find((x) => x.id === node.dataset.id);
      if (!it) return;
      node.textContent = it.type === "timer"
        ? formatTimer(displayTimerMs(it, now))
        : formatStopwatch(displayStopwatchMs(it, now));
    });
    items().forEach((it) => {
      if (it.type !== "timer") return;
      const left = displayTimerMs(it, now);
      if (it.running && left <= 0 && !lastTimerZero.has(it.id)) {
        lastTimerZero.add(it.id);
        updateItem(it.id, (x) => ({ ...pauseItem(x, now), remainingMs: 0, running: false, runStartedAt: null }));
        playDone();
      }
      if (left > 0) lastTimerZero.delete(it.id);
    });
    if (openId && !detail.hidden) {
      const it = items().find((x) => x.id === openId);
      const digits = detail.querySelector(".digits");
      if (it && digits) {
        digits.textContent = it.type === "timer"
          ? formatTimer(displayTimerMs(it, now))
          : formatStopwatch(displayStopwatchMs(it, now));
      }
      if (it && it.type === "stopwatch") {
        const laps = it.laps || [];
        const last = laps.length - 1;
        detail.querySelectorAll(".lap-cell").forEach((cell, i) => {
          const ms = laps[i];
          const t = cell.querySelector(".lap-t");
          if (t) t.textContent = ms != null ? formatStopwatch(ms) : "";
          cell.classList.toggle("is-filled", ms != null);
          cell.classList.toggle("is-on", i === last && ms != null);
        });
      }
    }
    raf = requestAnimationFrame(tickDisplay);
  }

  renderList();
  raf = requestAnimationFrame(tickDisplay);
  ctx.onChange(() => {
    if (editingId) return;
    if (!openId) renderList();
  });

  return {
    destroy() { cancelAnimationFrame(raf); },
    refresh() {
      renderList();
      if (openId) paintDetail();
    },
    async openSettings() {
      const list = items();
      if (!list.length) {
        const type = await openChoices({
          title: "Add",
          message: "Timer or stopwatch — max 5.",
          choices: [
            { label: "Timer", value: "timer" },
            { label: "Stopwatch", value: "stopwatch" }
          ]
        });
        if (!type) return;
        const next = addTimeItem(list, type);
        patchItems(next);
        openDetail(next[next.length - 1].id);
        return;
      }
      if (list.length === 1) {
        openDetail(list[0].id);
        return;
      }
      const id = await openChoices({
        title: "Time settings",
        message: "Which clock do you want to set?",
        choices: list.map((it, i) => ({
          label: timeDisplayName(it, i),
          value: it.id
        }))
      });
      if (id) openDetail(id);
    }
  };
}
