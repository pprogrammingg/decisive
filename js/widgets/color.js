import {
  SLOT_YELLOW,
  activePalette,
  colorChangeLabel,
  colorSettingsErrors,
  isLightHex,
  lockRequiredSlots,
  nextColorDelayMs,
  parseNum,
  pickedColors,
  slotLocked
} from "../logic/color.js";
import { delayField } from "../step-field.js";
import { openForm } from "../dialog.js";

export function mountColor(body, ctx) {
  const fill = document.createElement("div");
  fill.className = "color-fill";
  body.append(fill);
  let timer = 0;

  function paint() {
    const colors = activePalette(ctx.get());
    const hex = colors[(Math.random() * colors.length) | 0];
    fill.style.background = hex;
    fill.dataset.hex = hex;
  }

  function loop() {
    clearTimeout(timer);
    paint();
    timer = setTimeout(loop, Math.max(80, nextColorDelayMs(ctx.get())));
  }

  loop();

  return {
    destroy() { clearTimeout(timer); },
    async openSettings() {
      const cur = ctx.get();
      const values = await openForm({
        title: "Color change",
        build(root, ui) {
          const slots = lockRequiredSlots(cur.slots);
          const grid = document.createElement("div");
          grid.className = "swatch-grid";
          const minL = document.createElement("label");
          minL.className = "field";
          minL.htmlFor = "c-lo";
          minL.textContent = "Min (s)";
          const maxL = document.createElement("label");
          maxL.className = "field";
          maxL.htmlFor = "c-hi";
          maxL.textContent = "Max (s)";
          const lo = delayField("c-lo", cur.delayLo);
          const hi = delayField("c-hi", cur.delayHi);
          const notes = document.createElement("div");

          function sync() {
            const draft = { slots: slots.slice(), delayLo: lo.value, delayHi: hi.value };
            const errors = colorSettingsErrors(draft);
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
              const a = parseNum(lo.value);
              const b = parseNum(hi.value);
              p.textContent = colorChangeLabel(pickedColors(slots).length, a, b);
              notes.append(p);
            }
            if (ui && ui.setSaveEnabled) ui.setSaveEnabled(!errors.length);
          }

          function paintGrid() {
            grid.replaceChildren();
            slots.forEach((hex, i) => {
              const cell = document.createElement("div");
              cell.className = "swatch-cell" + (hex ? " is-on" : "") + (hex && isLightHex(hex) ? " is-light" : "");
              if (hex) cell.style.background = hex;
              const picker = document.createElement("input");
              picker.type = "color";
              picker.value = (hex || SLOT_YELLOW).toLowerCase();
              picker.setAttribute("aria-label", hex ? "Colour " + (i + 1) : "Pick colour " + (i + 1));
              picker.oninput = () => {
                slots[i] = picker.value.toUpperCase();
                paintGrid();
                sync();
              };
              cell.append(picker);
              if (!hex) {
                const none = document.createElement("span");
                none.className = "swatch-none";
                none.textContent = "None";
                cell.append(none);
              } else if (!slotLocked(i)) {
                const clear = document.createElement("button");
                clear.type = "button";
                clear.className = "swatch-clear";
                clear.setAttribute("aria-label", "No colour");
                clear.textContent = "✕";
                clear.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  slots[i] = "";
                  paintGrid();
                  sync();
                };
                cell.append(clear);
              }
              grid.append(cell);
            });
          }

          lo.oninput = hi.oninput = sync;
          paintGrid();
          sync();
          root.append(grid, minL, lo.wrap, maxL, hi.wrap, notes);
          return () => ({
            slots: lockRequiredSlots(slots),
            delayLo: lo.value,
            delayHi: hi.value
          });
        }
      });
      if (values) {
        ctx.set(values);
        loop();
      }
    }
  };
}
