function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function mountOverlay(node, onDismiss) {
  const overlay = el("div", "dlg-overlay");
  overlay.append(node);
  if (onDismiss) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        onDismiss();
      }
    });
  }
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
    const overlay = mountOverlay(box);
    const collect = build(body, {
      setSaveEnabled(on) {
        save.disabled = !on;
      }
    });
    cancel.onclick = () => finish(null);
    save.onclick = async () => {
      if (save.disabled) return;
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
    const overlay = mountOverlay(box);
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

export function openInfo({ title, body }) {
  return new Promise((resolve) => {
    const overlay = el("div", "info-overlay");
    const box = el("div", "info-pop");
    box.setAttribute("role", "dialog");
    const head = el("div", "info-pop-head");
    head.append(el("h2", "", title || "Info"));
    const close = el("button", "icon-btn");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.textContent = "✕";
    head.append(close);
    box.append(head, el("p", "info-pop-body", body || ""));
    overlay.append(box);
    document.getElementById("dialogs").append(overlay);
    let settled = false;
    let gone = false;
    const done = () => {
      if (gone) return;
      gone = true;
      overlay.remove();
      resolve();
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKey);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        done();
        return;
      }
      overlay.classList.add("is-out");
      box.classList.add("is-out");
      overlay.addEventListener("animationend", done, { once: true });
      setTimeout(done, 280);
    };
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    close.onclick = finish;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) finish();
    });
  });
}

export { el };
