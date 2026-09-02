import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from "react-native";
import {
  addLap,
  addMinute,
  displayStopwatchMs,
  displayTimerMs,
  formatLapSplit,
  formatStopwatch,
  formatTimer,
  hmsToMs,
  LAP_ROWS,
  lapSplitMs,
  MAX_SUB,
  newTimeItem,
  pauseItem,
  renameTimeItem,
  resetItem,
  startItem,
  TIME_NAME_MAX,
  timeDisplayName,
  type TimeItem,
} from "../logic";
import { colors } from "../theme";

export function TimePane({
  items,
  onChange,
  expanded,
}: {
  items: TimeItem[];
  onChange: (items: TimeItem[]) => void;
  expanded: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const zeroLock = useRef(new Set<string>());
  const lastTap = useRef({ id: "", at: 0 });
  const open = items.find((x) => x.id === openId);
  const openIndex = items.findIndex((x) => x.id === openId);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const t = Date.now();
    let changed = false;
    const next = items.map((it) => {
      if (it.type !== "timer" || !it.running) return it;
      if (displayTimerMs(it, t) > 0) {
        zeroLock.current.delete(it.id);
        return it;
      }
      if (zeroLock.current.has(it.id)) return it;
      zeroLock.current.add(it.id);
      changed = true;
      return { ...pauseItem(it, t), remainingMs: 0, running: false, runStartedAt: null };
    });
    if (changed) {
      Vibration.vibrate(80);
      onChange(next);
    }
  }, [now, items, onChange]);

  function patch(id: string, fn: (it: TimeItem) => TimeItem) {
    onChange(items.map((it) => (it.id === id ? fn(it) : it)));
  }

  function openOnDoubleTap(id: string) {
    const t = Date.now();
    if (lastTap.current.id === id && t - lastTap.current.at < 400) {
      lastTap.current = { id: "", at: 0 };
      setOpenId(id);
      return;
    }
    lastTap.current = { id, at: t };
  }

  function commitName(it: TimeItem) {
    onChange(renameTimeItem(items, it.id, draftName));
    setEditingId(null);
  }

  function removeItem(it: TimeItem) {
    Alert.alert("Remove", "Delete this timer / stopwatch?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onChange(items.filter((x) => x.id !== it.id)),
      },
    ]);
  }

  if (open && expanded) {
    const isTimer = open.type === "timer";
    const shown = isTimer ? formatTimer(displayTimerMs(open, now)) : formatStopwatch(displayStopwatchMs(open, now));
    const dur = Math.floor((open.durationMs || 0) / 1000);
    const laps = open.laps || [];
    return (
      <View style={styles.face}>
        <View style={styles.top}>
          <Pressable onPress={() => setOpenId(null)}><Text style={styles.back}>←</Text></Pressable>
          <Text style={styles.heading} numberOfLines={1}>{timeDisplayName(open, openIndex)}</Text>
        </View>
        <Text style={[styles.digits, !isTimer && styles.digitsSw]}>{shown}</Text>
        {isTimer ? (
          <View style={styles.hms}>
            <Field
              label="h"
              value={String(Math.floor(dur / 3600))}
              onSubmit={(v) => {
                const m = Math.floor((dur % 3600) / 60);
                const s = dur % 60;
                const ms = hmsToMs(+v || 0, m, s);
                patch(open.id, (it) => ({ ...it, durationMs: ms, remainingMs: ms, running: false, runStartedAt: null }));
              }}
            />
            <Field
              label="m"
              value={String(Math.floor((dur % 3600) / 60))}
              onSubmit={(v) => {
                const h = Math.floor(dur / 3600);
                const s = dur % 60;
                const ms = hmsToMs(h, +v || 0, s);
                patch(open.id, (it) => ({ ...it, durationMs: ms, remainingMs: ms, running: false, runStartedAt: null }));
              }}
            />
            <Field
              label="s"
              value={String(dur % 60)}
              onSubmit={(v) => {
                const h = Math.floor(dur / 3600);
                const m = Math.floor((dur % 3600) / 60);
                const ms = hmsToMs(h, m, +v || 0);
                patch(open.id, (it) => ({ ...it, durationMs: ms, remainingMs: ms, running: false, runStartedAt: null }));
              }}
            />
          </View>
        ) : null}
        <View style={styles.row}>
          <Act label="Start" go onPress={() => patch(open.id, startItem)} />
          <Act label="Pause" onPress={() => patch(open.id, pauseItem)} />
          {!isTimer ? <Act label="Lap" onPress={() => patch(open.id, addLap)} /> : null}
          <Act label="Reset" onPress={() => patch(open.id, resetItem)} />
          {isTimer ? <Act label="+1:00" onPress={() => patch(open.id, addMinute)} /> : null}
        </View>
        {!isTimer ? (
          <View style={styles.lapBox}>
            <View style={styles.lapHead}>
              <Text style={styles.lapH}>elapsed</Text>
              <Text style={[styles.lapH, styles.lapHRight]}>split</Text>
            </View>
            <ScrollView style={styles.lapWrap} nestedScrollEnabled>
              {Array.from({ length: Math.max(laps.length, LAP_ROWS) }, (_, i) => {
                const ms = laps[i];
                const on = i === laps.length - 1 && ms != null;
                return (
                  <View key={i} style={styles.lapRow}>
                    <Text style={[styles.lapT, ms != null && styles.lapFilled, on && styles.lapOn]}>
                      {ms != null ? formatStopwatch(ms) : "––:––.––"}
                    </Text>
                    <Text style={[styles.lapT, styles.lapSplit, ms != null && styles.lapFilled, on && styles.lapOn]}>
                      {ms != null ? formatLapSplit(lapSplitMs(laps, i)) : "–.––––––"}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView style={styles.face} contentContainerStyle={{ gap: 8, padding: 8 }}>
      {items.map((it, i) => (
        <View key={it.id} style={styles.item}>
          {editingId === it.id ? (
            <TextInput
              style={styles.itemInput}
              autoFocus
              maxLength={TIME_NAME_MAX}
              value={draftName}
              onChangeText={setDraftName}
              onBlur={() => commitName(it)}
              onSubmitEditing={() => commitName(it)}
              selectionColor="transparent"
            />
          ) : (
            <Pressable
              style={styles.itemName}
              onPress={() => {
                setDraftName(timeDisplayName(it, i));
                setEditingId(it.id);
              }}
              onLongPress={() => removeItem(it)}
            >
              <Text style={styles.itemT} numberOfLines={1}>{timeDisplayName(it, i)}</Text>
            </Pressable>
          )}
          <Pressable style={styles.itemOpen} onPress={() => openOnDoubleTap(it.id)} onLongPress={() => removeItem(it)}>
            <Text style={styles.meta}>
              {it.type === "timer" ? formatTimer(displayTimerMs(it, now)) : formatStopwatch(displayStopwatchMs(it, now))}
            </Text>
          </Pressable>
        </View>
      ))}
      {items.length < MAX_SUB ? (
        <Pressable
          style={({ pressed }) => [styles.add, pressed && styles.pressRow]}
          onPress={() =>
            Alert.alert("Add", "Timer or stopwatch — max 5.", [
              { text: "Cancel", style: "cancel" },
              { text: "Timer", onPress: () => onChange(items.concat(newTimeItem("timer"))) },
              { text: "Stopwatch", onPress: () => onChange(items.concat(newTimeItem("stopwatch"))) },
            ])
          }
        >
          <Text style={styles.addT}>+ Add timer or stopwatch</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function Field({ label, value, onSubmit }: { label: string; value: string; onSubmit: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <View>
      <Text style={styles.muted}>{label}</Text>
      <TextInput
        style={styles.inp}
        keyboardType="number-pad"
        value={v}
        onChangeText={setV}
        onEndEditing={() => onSubmit(v)}
      />
    </View>
  );
}

function Act({ label, onPress, go }: { label: string; onPress: () => void; go?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.act, go && styles.go, pressed && styles.actOn]}
      onPress={onPress}
    >
      <Text style={[styles.actT, go && { color: "#06221a" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, backgroundColor: colors.ink2 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingTop: 4 },
  back: { color: colors.periwinkle, fontWeight: "700", padding: 8 },
  heading: { flex: 1, color: colors.cream, fontWeight: "700", letterSpacing: 0.5 },
  digits: { color: colors.cream, fontSize: 48, fontWeight: "200", textAlign: "center", marginVertical: 12 },
  digitsSw: { fontSize: 36, marginVertical: 6 },
  hms: { flexDirection: "row", justifyContent: "center", gap: 10 },
  inp: { width: 64, backgroundColor: "#0008", color: colors.cream, borderRadius: 10, padding: 8, textAlign: "center", fontSize: 20 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 },
  act: { backgroundColor: "#ffffff18", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  actOn: { transform: [{ scale: 0.97 }], opacity: 0.88 },
  go: { backgroundColor: colors.ok },
  actT: { color: colors.cream, fontWeight: "700" },
  item: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 14, backgroundColor: "#ffffff10" },
  itemName: { flexGrow: 0, flexShrink: 1, maxWidth: "58%", minWidth: 0, paddingVertical: 4 },
  itemOpen: { flex: 1, alignItems: "flex-end", justifyContent: "center", minWidth: 0, paddingVertical: 4 },
  itemT: { color: colors.cream, fontWeight: "700" },
  itemInput: {
    width: 132,
    maxWidth: 132,
    flexGrow: 0,
    flexShrink: 0,
    color: colors.cream,
    fontWeight: "800",
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ffffff1f",
  },
  meta: { color: colors.muted, fontVariant: ["tabular-nums"] },
  add: { padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: colors.periwinkle, alignItems: "center" },
  pressRow: { backgroundColor: colors.pressActive, transform: [{ scale: 0.98 }] },
  addT: { color: colors.periwinkle, fontWeight: "700" },
  lapBox: {
    flex: 1,
    minHeight: 0,
    alignSelf: "center",
    width: "92%",
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ffffff14",
    borderRadius: 12,
    backgroundColor: "#ffffff08",
    overflow: "hidden",
  },
  lapHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff14",
  },
  lapH: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  lapHRight: { textAlign: "right" },
  lapWrap: { maxHeight: 10 * 22 },
  lapRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, height: 22, alignItems: "center" },
  lapT: { color: colors.muted, fontSize: 12, fontVariant: ["tabular-nums"], letterSpacing: 0.4, opacity: 0.28 },
  lapSplit: { textAlign: "right" },
  lapFilled: { opacity: 0.85, color: colors.cream },
  lapOn: { opacity: 1, color: colors.cream, fontWeight: "700" },
  muted: { color: colors.muted, textAlign: "center" },
});
