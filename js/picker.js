import { WIDGET_META, uniqueOrder, togglePending, MAX_WIDGETS } from "./logic/order.js";
import { el } from "./dialog.js";
import { phEl } from "./icons.js";

function badge(kind, extra) {
  const b = el("div", "badge " + kind + (extra || ""));
  b.textContent = kind.includes("check") ? "✓" : "+";
  return b;
}

export function paintPicker(list, order, pending) {
  list.replaceChildren();
  const o = uniqueOrder(order);
  const room = o.length + pending.length < MAX_WIDGETS;
  for (const id of Object.keys(WIDGET_META)) {
    const meta = WIDGET_META[id];
    const added = o.includes(id);
    const isPend = pending.includes(id);
    const row = el("button", "picker-row" + (added ? " is-added" : "") + (isPend ? " is-pending" : ""));
    row.type = "button";
    row.dataset.id = id;
    const icon = el("div", "picker-icon");
    if (meta.icon === "music-note") icon.append(phEl("music-note"));
    else icon.textContent = meta.icon;
    const text = el("div", "picker-text");
    text.append(el("b", "", meta.title), el("span", "", meta.blurb));
    row.append(icon, text);
    if (added) row.append(badge("badge-check"));
    else {
      const can = isPend || room;
      row.append(badge("badge-add", can ? "" : " is-off"));
      if (!can && !isPend) row.disabled = true;
    }
    list.append(row);
  }
}

export function pickerClick(order, pending, id) {
  return togglePending(order, pending, id);
}
