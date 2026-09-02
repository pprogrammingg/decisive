import {
  addStatsItem,
  canAddStats,
  compactPairs,
  padPairs,
  renameStatsItem,
  statsDisplayName,
  statsLabel
} from "../logic/stats.js";
import { openChoices, openForm } from "../dialog.js";

function btn(cls, text) {
  const b = document.createElement("button");
  b.className = cls;
  b.type = "button";
  b.textContent = text;
  return b;
}

export function mountStats(body, ctx) {
  const listFace = document.createElement("div");
  listFace.className = "list-face";
  const grid = document.createElement("div");
  grid.className = "stats-grid";
  listFace.append(grid);
  body.append(listFace);

  let editingId = null;

  function items() {
    return ctx.get().items || [];
  }

  function patch(next) {
    ctx.set({ items: next });
  }

  function renderList() {
    if (editingId) return;
    grid.replaceChildren();
    items().forEach((it, i) => {
      const chip = document.createElement("div");
      chip.className = "stats-chip";
      const nameBtn = btn("stats-name", statsDisplayName(it, i));
      nameBtn.title = "Tap to rename";
      nameBtn.onclick = (e) => {
        e.stopPropagation();
        startRename(chip, it, i);
      };
      const openBtn = btn("stats-open", "▦");
      openBtn.setAttribute("aria-label", "Open " + statsDisplayName(it, i) + " fields");
      openBtn.onclick = (e) => {
        e.stopPropagation();
        editSheet(it.id);
      };
      chip.append(nameBtn, openBtn);
      grid.append(chip);
    });
    if (canAddStats(items())) {
      const add = btn("add-row", "+ Add " + statsLabel(items().length));
      add.style.gridColumn = "1 / -1";
      add.onclick = async () => {
        const next = addStatsItem(items());
        patch(next);
        await editSheet(next[next.length - 1].id);
      };
      grid.append(add);
    }
  }

  function startRename(chip, it, index) {
    editingId = it.id;
    const input = document.createElement("input");
    input.className = "stats-name-input";
    input.type = "text";
    input.maxLength = 10;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = statsDisplayName(it, index);
    input.setAttribute("aria-label", "Sheet name");
    chip.replaceChildren(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      editingId = null;
      if (save) patch(renameStatsItem(items(), it.id, input.value));
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

  async function editSheet(id) {
    const list = items();
    const it = list.find((x) => x.id === id);
    if (!it) return;
    const index = list.findIndex((x) => x.id === id);
    const values = await openForm({
      title: statsDisplayName(it, index),
      build(el) {
        const g = document.createElement("div");
        g.className = "pair-grid";
        const keys = [];
        const vals = [];
        const pairs = padPairs(it.pairs);
        for (let i = 0; i < 10; i++) {
          const k = document.createElement("input");
          k.className = "k";
          k.placeholder = "key " + (i + 1);
          k.value = pairs[i].key;
          const v = document.createElement("input");
          v.className = "v";
          v.placeholder = "value " + (i + 1);
          v.value = pairs[i].value;
          keys.push(k);
          vals.push(v);
          g.append(k, v);
        }
        el.append(g);
        return () => keys.map((k, i) => ({ key: k.value, value: vals[i].value }));
      }
    });
    if (!values) return;
    patch(items().map((x) => x.id === id ? { ...x, pairs: padPairs(compactPairs(values)) } : x));
  }

  async function openSettings() {
    const list = items();
    if (!list.length) {
      const next = addStatsItem(list);
      patch(next);
      await editSheet(next[next.length - 1].id);
      return;
    }
    if (list.length === 1) {
      await editSheet(list[0].id);
      return;
    }
    const id = await openChoices({
      title: "Stats settings",
      message: "Which sheet?",
      choices: list.map((it, i) => ({ label: statsDisplayName(it, i), value: it.id }))
    });
    if (id) await editSheet(id);
  }

  renderList();
  ctx.onChange(renderList);

  return {
    destroy() {},
    refresh: renderList,
    openSettings
  };
}
