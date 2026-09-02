import { DELAY_MAX, DELAY_MIN, DELAY_STEP, nudgeDelay } from "./logic/delay.js";

export function delayField(id, value) {
  const wrap = document.createElement("div");
  wrap.className = "step-row";
  const down = document.createElement("button");
  down.type = "button";
  down.className = "step-btn";
  down.setAttribute("aria-label", "Decrease");
  down.textContent = "−";
  const inp = document.createElement("input");
  inp.id = id;
  inp.type = "number";
  inp.min = String(DELAY_MIN);
  inp.max = String(DELAY_MAX);
  inp.step = String(DELAY_STEP);
  inp.inputMode = "decimal";
  inp.value = value;
  const up = document.createElement("button");
  up.type = "button";
  up.className = "step-btn";
  up.setAttribute("aria-label", "Increase");
  up.textContent = "+";
  down.onclick = () => {
    inp.value = nudgeDelay(inp.value, -DELAY_STEP);
    inp.dispatchEvent(new Event("input"));
  };
  up.onclick = () => {
    inp.value = nudgeDelay(inp.value, DELAY_STEP);
    inp.dispatchEvent(new Event("input"));
  };
  wrap.append(down, inp, up);
  return Object.assign(inp, { wrap });
}
