/** Compact 15-character label field. No row-wide glow; caret at end, no select-all. */
export function swapToLabelEdit(el, { value, maxLen, ariaLabel, onCommit, onCancel }) {
  const input = document.createElement("input");
  input.className = "label-edit";
  input.type = "text";
  input.maxLength = String(maxLen);
  input.size = 15;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.value = value;
  if (ariaLabel) input.setAttribute("aria-label", ariaLabel);
  el.replaceWith(input);
  input.focus();
  const n = input.value.length;
  input.setSelectionRange(n, n);
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (save) onCommit(input.value);
    else onCancel();
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
  return input;
}
