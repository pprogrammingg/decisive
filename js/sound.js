let ctx = null;
let blocked = true;

export function audioBlocked() {
  return blocked;
}

export async function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    blocked = false;
    return;
  }
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch { /* ignore */ }
  }
  blocked = ctx.state !== "running";
}

export function playChime() {
  if (!ctx || ctx.state !== "running") return false;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.4);
  return true;
}

export function playDone() {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = 523;
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.62);
}
