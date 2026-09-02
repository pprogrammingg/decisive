export function phEl(name) {
  const s = document.createElement("span");
  s.className = "ph-icon";
  s.dataset.ph = name;
  s.setAttribute("aria-hidden", "true");
  return s;
}
