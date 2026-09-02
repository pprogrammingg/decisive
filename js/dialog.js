function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function mountOverlay(node, onDismiss) {
  const overlay = el("div", "dlg-overlay");
  overlay.append(node);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onDismiss) onDismiss();
    }
  });
  document.getElementById("dialogs").append(overlay);
  return overlay;
}

export function openConfirm({ title, message, okText = "Confirm", danger = false }) {
  return new Promise((resolve) => {
    const box = el("div", "dlg");
    box.setAttribute("role", "dialog");
    box.append(el("h2", "", title || "Confirm"));
    box.append(el("p", "msg", message || ""));
    const row = el("div", "dlg-actions");
    const cancel = el("button", "btn", "Cancel");
    const ok = el("button", "btn " + (danger ? "btn-danger" : "btn-primary"), okText);
    row.append(cancel, ok);
    box.append(row);
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      resolve(v);
    };
    const overlay = mountOverlay(box, () => finish(false));
    cancel.onclick = () => finish(false);
    ok.onclick = () => finish(true);
  });
}

export function openForm({ title, build, saveText = "Save" }) {
  return new Promise((resolve) => {
    const box = el("div", "dlg");
    box.setAttribute("role", "dialog");
    box.append(el("h2", "", title || "Settings"));
    const body = el("div");
    box.append(body);
    const collect = build(body);
    const row = el("div", "dlg-actions");
    const cancel = el("button", "btn", "Cancel");
    const save = el("button", "btn btn-primary", saveText);
    row.append(cancel, save);
    box.append(row);
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      resolve(v);
    };
    const overlay = mountOverlay(box, () => finish(null));
    cancel.onclick = () => finish(null);
    save.onclick = async () => {
      const values = collect();
      const ok = await openConfirm({
        title: "Save settings",
        message: "Save these settings?",
        okText: "Save"
      });
      if (ok) finish(values);
    };
  });
}

export function openChoices({ title, message, choices }) {
  return new Promise((resolve) => {
    const box = el("div", "dlg");
    box.setAttribute("role", "dialog");
    box.append(el("h2", "", title || "Choose"));
    if (message) box.append(el("p", "msg", message));
    const row = el("div", "dlg-actions");
    const cancel = el("button", "btn", "Cancel");
    row.append(cancel);
    box.append(row);
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      resolve(v);
    };
    const overlay = mountOverlay(box, () => finish(null));
    cancel.onclick = () => finish(null);
    (choices || []).forEach((c) => {
      const b = el("button", "btn btn-primary", c.label);
      b.onclick = () => finish(c.value);
      row.append(b);
    });
  });
}

export function openPicker({ order, paint, onToggle }) {
  return new Promise((resolve) => {
    const box = el("div", "dlg");
    box.setAttribute("role", "dialog");
    box.append(el("h2", "", "Add widgets"));
    box.append(el("p", "msg", "Pick one or more, then save. Max four on the board."));
    const list = el("div", "picker-list");
    box.append(list);
    const row = el("div", "dlg-actions");
    const cancel = el("button", "btn", "Cancel");
    const save = el("button", "btn btn-primary", "Save");
    row.append(cancel, save);
    box.append(row);
    let pending = [];
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      overlay.remove();
      resolve(v);
    };
    const overlay = mountOverlay(box, () => finish(null));
    const redraw = () => paint(list, order, pending);
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn || btn.disabled) return;
      pending = onToggle(order, pending, btn.dataset.id);
      redraw();
    });
    redraw();
    cancel.onclick = () => finish(null);
    save.onclick = () => finish(pending.slice());
  });
}

export { el };
