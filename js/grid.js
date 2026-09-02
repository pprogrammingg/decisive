import { WIDGET_META, removeWidget, swapWidgets } from "./logic/order.js";
import { openConfirm, openInfo } from "./dialog.js";
import { phEl } from "./icons.js";
import { mountColor } from "./widgets/color.js";
import { mountChime } from "./widgets/chime.js";
import { mountTime } from "./widgets/time.js";
import { mountStats } from "./widgets/stats.js";

const MOUNTS = {
  color: mountColor,
  chime: mountChime,
  time: mountTime,
  stats: mountStats
};

function iconBtn(cls, label, text) {
  const b = document.createElement("button");
  b.className = "icon-btn " + cls;
  b.type = "button";
  b.setAttribute("aria-label", label);
  if (text) b.textContent = text;
  return b;
}

export function createBoard(board, api) {
  const instances = new Map();
  let fullId = null;

  function setFull(id) {
    fullId = id;
    instances.forEach((inst, wid) => {
      const on = wid === id;
      inst.el.classList.toggle("is-full", on);
      inst.expand.textContent = on ? "↙" : "↗";
      inst.expand.setAttribute("aria-label", on ? "Contract" : "Expand");
    });
    document.body.classList.toggle("has-full", !!id);
  }

  function expand(id) {
    if (api.order().length <= 1) return;
    setFull(fullId === id ? null : id);
  }

  function paintEmpty() {
    board.replaceChildren();
    if (api.order().length) return;
    const empty = document.createElement("div");
    empty.className = "board-empty";
    empty.append(document.createElement("strong"));
    empty.firstChild.textContent = "Decisive";
    empty.append(document.createTextNode("Add a widget to begin"));
    board.append(empty);
  }

  function bindDrag(el, id, handle) {
    handle.addEventListener("pointerdown", (e) => {
      if (fullId) return;
      handle.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
    });
    handle.addEventListener("pointerup", (e) => {
      el.classList.remove("is-dragging");
      instances.forEach((i) => i.el.classList.remove("is-drop"));
      if (fullId) return;
      el.style.pointerEvents = "none";
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      el.style.pointerEvents = "";
      const other = hit && hit.closest("[data-widget]");
      const to = other && other.dataset.widget;
      if (to && to !== id) api.reorder(swapWidgets(api.order(), id, to));
    });
    handle.addEventListener("pointermove", (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      instances.forEach((i) => i.el.classList.remove("is-drop"));
      el.style.pointerEvents = "none";
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      el.style.pointerEvents = "";
      const other = hit && hit.closest("[data-widget]");
      if (other && other.dataset.widget !== id) other.classList.add("is-drop");
    });
  }

  function create(id) {
    const el = document.createElement("article");
    el.className = "widget";
    el.dataset.widget = id;
    const bar = document.createElement("header");
    bar.className = "widget-bar";
    const drag = iconBtn("drag", "Move", "⋮⋮");
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = WIDGET_META[id].title;
    const info = iconBtn("info", "About " + WIDGET_META[id].title, "");
    info.append(phEl("info"));
    const gear = iconBtn("gear", "Settings", "⚙");
    const trash = iconBtn("remove", "Remove", "✕");
    const expandBtn = iconBtn("expand", "Expand", "↗");
    const actions = document.createElement("div");
    actions.className = "widget-bar-actions";
    actions.append(info, gear, trash, expandBtn);
    bar.append(drag, title, actions);
    const body = document.createElement("div");
    body.className = "widget-body";
    el.append(bar, body);

    const listeners = new Set();
    const ctx = {
      get: () => api.slice(id),
      set: (patch) => api.patch(id, patch),
      expand: () => {
        if (api.order().length <= 1) return;
        setFull(id);
      },
      onChange(fn) { listeners.add(fn); }
    };
    const widgetApi = MOUNTS[id](body, ctx);
    info.onclick = (e) => {
      e.stopPropagation();
      openInfo({ title: WIDGET_META[id].title, body: WIDGET_META[id].about });
    };
    gear.onclick = (e) => {
      e.stopPropagation();
      if (widgetApi.openSettings) widgetApi.openSettings();
    };
    if (!widgetApi.openSettings) gear.hidden = true;
    trash.onclick = async (e) => {
      e.stopPropagation();
      const ok = await openConfirm({
        title: "Remove widget",
        message: "Remove " + WIDGET_META[id].title + " from the board?",
        okText: "Remove",
        danger: true
      });
      if (ok) api.remove(id);
    };
    expandBtn.onclick = (e) => {
      e.stopPropagation();
      expand(id);
    };
    bindDrag(el, id, drag);

    const inst = { el, expand: expandBtn, api: widgetApi, listeners };
    instances.set(id, inst);
    return inst;
  }

  function sync(order) {
    for (const id of [...instances.keys()]) {
      if (!order.includes(id)) {
        const inst = instances.get(id);
        inst.api.destroy();
        inst.el.remove();
        instances.delete(id);
        if (fullId === id) setFull(null);
      }
    }
    if (!order.length) {
      paintEmpty();
      board.dataset.n = "0";
      return;
    }
    board.querySelector(".board-empty")?.remove();
    order.forEach((id) => {
      if (!instances.has(id)) create(id);
      board.append(instances.get(id).el);
    });
    board.dataset.n = String(order.length);
    if (order.length <= 1 && fullId) setFull(null);
  }

  function notify(id) {
    instances.get(id)?.listeners.forEach((fn) => fn());
  }

  return { sync, notify, setFull };
}
