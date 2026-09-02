import { loadState, saveState } from "./store.js";
import { ensureState } from "./logic/state.js";
import { APP_INFO, commitPicker, removeWidget } from "./logic/order.js";
import { openInfo, openPicker } from "./dialog.js";
import { paintPicker, pickerClick } from "./picker.js";
import { createBoard } from "./grid.js";
import { phEl } from "./icons.js";
import { unlockAudio } from "./sound.js";

const boardEl = document.getElementById("board");
const addBtn = document.getElementById("add");
const appInfoBtn = document.getElementById("app-info");
appInfoBtn.append(phEl("info"));
appInfoBtn.onclick = () => openInfo({ title: APP_INFO.title, body: APP_INFO.about });

let state = ensureState(null);
let saveTimer = 0;
const boardRef = { current: null };

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveState(state); }, 180);
}

function setState(next) {
  state = ensureState(next);
  persist();
}

const board = createBoard(boardEl, {
  order: () => state.layout.order,
  slice: (id) => state[id],
  patch(id, patch) {
    state = ensureState({
      ...state,
      [id]: { ...state[id], ...patch }
    });
    persist();
    boardRef.current.notify(id);
  },
  reorder(order) {
    setState({ ...state, layout: { order } });
    boardRef.current.sync(state.layout.order);
  },
  remove(id) {
    setState({ ...state, layout: { order: removeWidget(state.layout.order, id) } });
    boardRef.current.sync(state.layout.order);
  }
});
boardRef.current = board;

addBtn.onclick = async () => {
  const pending = await openPicker({
    order: state.layout.order,
    paint: paintPicker,
    onToggle: pickerClick
  });
  if (pending == null) return;
  const order = commitPicker(state.layout.order, pending);
  setState({ ...state, layout: { order } });
  board.sync(state.layout.order);
};

document.addEventListener("pointerdown", () => { unlockAudio(); }, { once: true });

state = await loadState();
board.sync(state.layout.order);
