import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, Vibration, View } from "react-native";
import { IconHit, PhIcon } from "../icons";
import { formatChimeEta, nextChimeDelaySec, type ChimeState } from "../logic";
import { colors } from "../theme";

export function ChimePane({ chime }: { chime: ChimeState }) {
  const [hit, setHit] = useState(false);
  const [eta, setEta] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const remainingRef = useRef(0);
  const dueRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chimeRef = useRef(chime);
  chimeRef.current = chime;

  const schedule = useCallback((fromMs?: number) => {
    clearTimeout(timerRef.current);
    if (pausedRef.current) return;
    const ms = fromMs != null ? Math.max(0, fromMs) : Math.max(1000, nextChimeDelaySec(chimeRef.current) * 1000);
    dueRef.current = Date.now() + ms;
    timerRef.current = setTimeout(() => {
      if (pausedRef.current) return;
      setHit(true);
      Vibration.vibrate(80);
      setTimeout(() => setHit(false), 400);
      schedule();
    }, ms);
  }, []);

  useEffect(() => {
    pausedRef.current = false;
    remainingRef.current = 0;
    setPaused(false);
    schedule();
    const i = setInterval(() => {
      const left = pausedRef.current ? remainingRef.current : Math.max(0, dueRef.current - Date.now());
      setEta(left);
    }, 250);
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(i);
    };
  }, [chime.mode, chime.fixed, chime.lo, chime.hi, schedule]);

  function toggle() {
    if (pausedRef.current) {
      const ms = remainingRef.current;
      pausedRef.current = false;
      remainingRef.current = 0;
      setPaused(false);
      schedule(ms);
    } else {
      remainingRef.current = Math.max(0, dueRef.current - Date.now());
      pausedRef.current = true;
      clearTimeout(timerRef.current);
      setPaused(true);
    }
  }

  return (
    <View style={[styles.face, hit && styles.hit]}>
      <View style={[styles.note, paused && styles.noteOff]}>
        <PhIcon name="music-note" size={44} color={colors.periwinkle} />
      </View>
      <Text style={styles.eta}>{formatChimeEta(eta, paused)}</Text>
      <IconHit label={paused ? "Resume" : "Pause"} onPress={toggle}>
        <PhIcon name={paused ? "play" : "pause"} size={20} color={colors.cream} />
      </IconHit>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.ink2 },
  hit: { backgroundColor: "#2a2f55" },
  note: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,155,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,155,255,0.35)",
  },
  noteOff: { opacity: 0.45 },
  eta: { color: colors.cream, fontWeight: "700", letterSpacing: 1 },
});
