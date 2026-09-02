import { ensureState, emptyState } from "./logic/state.js";

const LS_KEY = "decisive.state.v1";
const STATE_URL = "data/state.json";

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLocal(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota / private mode */ }
}

async function fetchFile() {
  try {
    const res = await fetch(STATE_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function putFile(state) {
  try {
    const res = await fetch(STATE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state, null, 2)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadState() {
  const local = readLocal();
  if (local) return ensureState(local);
  const file = await fetchFile();
  return ensureState(file || emptyState());
}

export async function saveState(state) {
  const next = ensureState(state);
  writeLocal(next);
  await putFile(next);
  return next;
}
