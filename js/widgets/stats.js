import {
  addStatsItem,
  canAddStats,
  compactPairs,
  padPairs,
  removeStatsItem,
  renameStatsItem,
  STATS_NAME_MAX,
  statsDisplayName,
  statsLabel
} from "../logic/stats.js";
import { openChoices, openConfirm, openForm } from "../dialog.js";
import { swapToLabelEdit } from "../label-edit.js";

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
      nameBtn.title = "Open fields — long-press to rename";
      nameBtn.setAttribute("aria-label", "Open " + statsDisplayName(it, i));
      let holdTimer = 0;
      let held = false;
      const clearHold = () => {
        if (holdTimer) clearTimeout(holdTimer);
        holdTimer = 0;
      };
      nameBtn.addEventListener("pointerdown", () => {
        held = false;
        holdTimer = setTimeout(() => {
          holdTimer = 0;
          held = true;
          startRename(nameBtn, it, i);
        }, 550);
      });
      nameBtn.addEventListener("pointerup", clearHold);
      nameBtn.addEventListener("pointerleave", clearHold);
      nameBtn.addEventListener("pointercancel", clearHold);
      nameBtn.onclick = (e) => {
        e.stopPropagation();
        if (held) {
          held = false;
          return;
        }
        editSheet(it.id);
      };
      const openBtn = btn("stats-open", "▦");
      openBtn.setAttribute("aria-label", "Open " + statsDisplayName(it, i) + " fields");
      openBtn.onclick = (e) => {
        e.stopPropagation();
        editSheet(it.id);
      };
      const trash = btn("icon-btn", "✕");
      trash.setAttribute("aria-label", "Remove " + statsDisplayName(it, i));
      trash.onclick = async (e) => {
        e.stopPropagation();
        const ok = await openConfirm({
          title: "Remove",
          message: "Delete this stats sheet?",
          okText: "Remove",
          danger: true
        });
        if (!ok) return;
        patch(removeStatsItem(items(), it.id));
        renderList();
      };
      chip.append(nameBtn, openBtn, trash);
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

  function startRename(nameBtn, it, index) {
    editingId = it.id;
    swapToLabelEdit(nameBtn, {
      value: statsDisplayName(it, index),
      maxLen: STATS_NAME_MAX,
      ariaLabel: "Sheet name",
      onCommit(v) {
        editingId = null;
        patch(renameStatsItem(items(), it.id, v));
      },
      onCancel() {
        editingId = null;
        renderList();
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
