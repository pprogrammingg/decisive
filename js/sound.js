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
  const dur = 0.5;
  function ping(type, freq0, freq1, peak) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq0, t);
    o.frequency.exponentialRampToValueAtTime(freq1, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.016);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  ping("sine", 880, 1320, 0.34);
  ping("triangle", 1320, 1760, 0.16);
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
