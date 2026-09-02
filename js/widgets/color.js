import {
  clampColorCount,
  colorDelayBounds,
  nextColorDelayMs,
  paletteForCount
} from "../logic/color.js";
import { openForm } from "../dialog.js";

export function mountColor(body, ctx) {
  const fill = document.createElement("div");
  fill.className = "color-fill";
  body.append(fill);
  let timer = 0;

  function paint() {
    const colors = paletteForCount(ctx.get().count);
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
        build(el) {
          const label = document.createElement("label");
          label.className = "field";
          label.htmlFor = "c-n";
          const nv = document.createElement("span");
          nv.textContent = String(clampColorCount(cur.count));
          label.append("Colors (", nv, ") 2–6");
          const range = document.createElement("input");
          range.id = "c-n";
          range.type = "range";
          range.min = "2";
          range.max = "6";
          range.value = String(clampColorCount(cur.count));
          range.oninput = () => { nv.textContent = String(clampColorCount(range.value)); };
          const ends = document.createElement("div");
          ends.className = "range-ends";
          ends.innerHTML = "<span>2</span><span>6</span>";
          const loL = document.createElement("label");
          loL.className = "field";
          loL.htmlFor = "c-lo";
          loL.textContent = "Delay lower (s)";
          const lo = document.createElement("input");
          lo.id = "c-lo";
          lo.type = "number";
          lo.min = "0.5";
          lo.max = "5";
          lo.step = "any";
          lo.inputMode = "decimal";
          lo.value = cur.delayLo;
          const hiL = document.createElement("label");
          hiL.className = "field";
          hiL.htmlFor = "c-hi";
          hiL.textContent = "Delay upper (s)";
          const hi = document.createElement("input");
          hi.id = "c-hi";
          hi.type = "number";
          hi.min = "0.5";
          hi.max = "5";
          hi.step = "any";
          hi.inputMode = "decimal";
          hi.value = cur.delayHi;
          const hint = document.createElement("p");
          hint.className = "hint";
          const sync = () => {
            const z = colorDelayBounds(lo.value, hi.value);
            hint.textContent = "Final delay: " + z.L + "–" + z.U + " s";
          };
          lo.oninput = hi.oninput = sync;
          sync();
          el.append(label, range, ends, loL, lo, hiL, hi, hint);
          return () => ({
            count: clampColorCount(range.value),
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
