import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native";
import {
  clampChimeSec,
  commitPicker,
  MAX_WIDGETS,
  removeWidget,
  swapWidgets,
  togglePending,
  WIDGET_IDS,
  WIDGET_META,
  APP_INFO,
  type WidgetId,
} from "../logic";
import { IconHit, PhIcon } from "../icons";
import { useAppState } from "../state/AppStateContext";
import { colors } from "../theme";
import { ColorPane, ColorSettings } from "./ColorPane";
import { ChimePane } from "./ChimePane";
import { StatsPane } from "./StatsPane";
import { TimePane } from "./TimePane";

export function HomeScreen() {
  const { state, ready, update } = useAppState();
  const { width, height } = useWindowDimensions();
  const [full, setFull] = useState<WidgetId | null>(null);
  const [pick, setPick] = useState(false);
  const [pending, setPending] = useState<WidgetId[]>([]);
  const [dragging, setDragging] = useState<WidgetId | null>(null);
  const [colorSet, setColorSet] = useState(false);
  const [chimeSet, setChimeSet] = useState(false);
  const [info, setInfo] = useState<{ title: string; body: string } | null>(null);
  const order = state.layout.order;
  const n = order.length;
  const cellW = n <= 2 ? width : width / 2;
  const cellH = n <= 1 ? height - 48 : (height - 48) / 2;

  useEffect(() => {
    if (n <= 1) setFull(null);
  }, [n]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  function body(id: WidgetId, expanded: boolean) {
    if (id === "color") {
      return (
        <ColorPane color={state.color} />
      );
    }
    if (id === "chime") {
      return (
        <ChimePane chime={state.chime} />
      );
    }
    if (id === "time") {
      return (
        <TimePane
          items={state.time.items}
          expanded={expanded}
          onChange={(items) => update((s) => { s.time.items = items; })}
        />
      );
    }
    return (
      <StatsPane
        items={state.stats.items}
        expanded={expanded}
        onChange={(items) => update((s) => { s.stats.items = items; })}
      />
    );
  }

  const shown = full ? [full] : order;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.grid}>
        {shown.length === 0 ? (
          <Text style={styles.muted}>Add a widget to begin</Text>
        ) : (
          shown.map((id) => {
            const solo = n === 1;
            const expanded = solo || full === id;
            const span = !expanded && n === 3 && id === order[order.length - 1];
            const w = expanded || solo ? width : span ? width : cellW;
            const h = expanded || solo ? height - 80 : cellH;
            return (
              <Pressable
                key={id}
                style={[styles.card, { width: w - 8, height: Math.max(120, h - 8) }]}
                onLongPress={() => setDragging(id)}
                onPress={() => {
                  if (dragging && dragging !== id) {
                    update((s) => { s.layout.order = swapWidgets(s.layout.order, dragging, id); });
                    setDragging(null);
                  }
                }}
              >
                <View style={styles.bar}>
                  <Text style={styles.title} numberOfLines={1}>{WIDGET_META[id].title}</Text>
                  <View style={styles.barActions}>
                  <IconHit
                    label={"About " + WIDGET_META[id].title}
                    onPress={() => setInfo({ title: WIDGET_META[id].title, body: WIDGET_META[id].about })}
                  >
                    <PhIcon name="info" size={18} color={colors.cream} />
                  </IconHit>
                  {id === "color" || id === "chime" ? (
                    <IconHit
                      label="Settings"
                      onPress={() => (id === "color" ? setColorSet(true) : setChimeSet(true))}
                    >
                      <Text style={styles.gear}>⚙</Text>
                    </IconHit>
                  ) : null}
                  {solo ? null : (
                    <IconHit label={expanded ? "Contract" : "Expand"} onPress={() => setFull(expanded ? null : id)}>
                      <Text style={styles.icon}>{full === id ? "↙" : "↗"}</Text>
                    </IconHit>
                  )}
                  {solo || full === id ? (
                    <IconHit
                      label="Remove"
                      onPress={() =>
                        Alert.alert("Remove widget", "Remove " + WIDGET_META[id].title + " from the board?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => {
                              setFull(null);
                              update((s) => { s.layout.order = removeWidget(s.layout.order, id); });
                            },
                          },
                        ])
                      }
                    >
                      <Text style={styles.icon}>✕</Text>
                    </IconHit>
                  ) : null}
                  </View>
                </View>
                <View style={styles.body}>{body(id, expanded)}</View>
                {dragging === id ? <Text style={styles.hint}>Tap another widget to swap</Text> : null}
              </Pressable>
            );
          })
        )}
      </View>
      {full ? null : (
        <View style={styles.fabRow} pointerEvents="box-none">
          <Pressable
            style={({ pressed }) => [styles.fab, pressed && styles.fabOn]}
            onPress={() => {
              setPending([]);
              setPick(true);
            }}
          >
            <Text style={styles.fabT}>+</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="About Decisive"
            style={({ pressed }) => [styles.fabInfo, pressed && styles.fabInfoOn]}
            onPress={() => setInfo({ title: APP_INFO.title, body: APP_INFO.about })}
          >
            <PhIcon name="info" size={22} color={colors.cream} />
          </Pressable>
        </View>
      )}

      <Modal visible={pick} transparent animationType="fade" onRequestClose={() => setPick(false)}>
        <View style={styles.overlay}>
          <View style={styles.dlg}>
            <Text style={styles.h}>Add widgets</Text>
            <Text style={styles.muted}>Pick one or more, then save. Max {MAX_WIDGETS}.</Text>
            {WIDGET_IDS.map((id) => {
              const added = order.includes(id);
              const isPend = pending.includes(id);
              const room = order.length + pending.length < MAX_WIDGETS;
              return (
                <Pressable
                  key={id}
                  style={({ pressed }) => [
                    styles.prow,
                    added && styles.dim,
                    isPend && styles.pend,
                    pressed && !added ? styles.prowOn : null,
                  ]}
                  disabled={added || (!isPend && !room)}
                  onPress={() => setPending(togglePending(order, pending, id))}
                >
                  {WIDGET_META[id].icon === "music-note" ? (
                    <View style={styles.piconWrap}>
                      <PhIcon name="music-note" size={22} color={colors.cream} />
                    </View>
                  ) : (
                    <Text style={styles.picon}>{WIDGET_META[id].icon}</Text>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pt}>{WIDGET_META[id].title}</Text>
                    <Text style={styles.muted}>{WIDGET_META[id].blurb}</Text>
                  </View>
                  <View style={[styles.badge, added ? styles.check : styles.addB]}>
                    <Text style={{ color: added ? "#06221a" : colors.addBlue, fontWeight: "800" }}>
                      {added ? "✓" : "+"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <View style={styles.actions}>
              <Pressable onPress={() => setPick(false)}><Text style={styles.muted}>Cancel</Text></Pressable>
              <Pressable
                onPress={() => {
                  update((s) => { s.layout.order = commitPicker(s.layout.order, pending); });
                  setPick(false);
                }}
              >
                <Text style={styles.save}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ColorSettings visible={colorSet} onClose={() => setColorSet(false)} />
      <ChimeSettings visible={chimeSet} onClose={() => setChimeSet(false)} />
      <InfoPop info={info} onClose={() => setInfo(null)} />
    </SafeAreaView>
  );
}

function InfoPop({
  info,
  onClose,
}: {
  info: { title: string; body: string } | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!info} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.infoOverlay} onPress={onClose}>
        <Pressable style={styles.infoPop} onPress={() => {}}>
          <View style={styles.infoHead}>
            <Text style={styles.infoTitle}>{info?.title}</Text>
            <IconHit label="Close" onPress={onClose}>
              <Text style={styles.icon}>✕</Text>
            </IconHit>
          </View>
          <Text style={styles.infoBody}>{info?.body}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChimeSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, update } = useAppState();
  const [mode, setMode] = useState(state.chime.mode);
  const [fixed, setFixed] = useState(String(state.chime.fixed));
  const [lo, setLo] = useState(String(state.chime.lo));
  const [hi, setHi] = useState(String(state.chime.hi));
  useEffect(() => {
    if (!visible) return;
    setMode(state.chime.mode);
    setFixed(String(state.chime.fixed));
    setLo(String(state.chime.lo));
    setHi(String(state.chime.hi));
  }, [visible, state.chime.mode, state.chime.fixed, state.chime.lo, state.chime.hi]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dlg}>
          <Text style={styles.h}>Interval chime</Text>
          <View style={styles.seg}>
            <Pressable style={[styles.segB, mode === "fixed" && styles.segOn]} onPress={() => setMode("fixed")}>
              <Text style={styles.pt}>Fixed</Text>
            </Pressable>
            <Pressable style={[styles.segB, mode === "random" && styles.segOn]} onPress={() => setMode("random")}>
              <Text style={styles.pt}>Random</Text>
            </Pressable>
          </View>
          {mode === "fixed" ? (
            <>
              <Text style={styles.muted}>Every N seconds (1–900)</Text>
              <TextInput style={styles.inp} keyboardType="number-pad" value={fixed} onChangeText={setFixed} />
            </>
          ) : (
            <>
              <Text style={styles.muted}>Random lower (s)</Text>
              <TextInput style={styles.inp} keyboardType="number-pad" value={lo} onChangeText={setLo} />
              <Text style={styles.muted}>Random upper (s)</Text>
              <TextInput style={styles.inp} keyboardType="number-pad" value={hi} onChangeText={setHi} />
            </>
          )}
          <View style={styles.actions}>
            <Pressable onPress={onClose}><Text style={styles.muted}>Cancel</Text></Pressable>
            <Pressable
              onPress={() =>
                Alert.alert("Save settings", "Save these settings?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Save",
                    onPress: () => {
                      update((s) => {
                        s.chime.mode = mode;
                        s.chime.fixed = clampChimeSec(fixed, 30);
                        s.chime.lo = clampChimeSec(lo, 5);
                        s.chime.hi = clampChimeSec(hi, 10);
                      });
                      onClose();
                    },
                  },
                ])
              }
            >
              <Text style={styles.save}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  grid: { flex: 1, flexDirection: "row", flexWrap: "wrap", padding: 4, alignContent: "flex-start" },
  card: { margin: 4, borderRadius: 18, overflow: "hidden", backgroundColor: colors.ink2, borderWidth: 1, borderColor: "#ffffff18" },
  bar: { flexDirection: "row", alignItems: "center", paddingLeft: 8, paddingRight: 4, paddingVertical: 4, backgroundColor: "#0006", gap: 8, zIndex: 2 },
  barActions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, flexShrink: 0 },
  title: { flex: 1, color: colors.cream, fontWeight: "800", letterSpacing: 1, fontSize: 11, textTransform: "uppercase", lineHeight: 36 },
  icon: { color: colors.cream, fontSize: 16, lineHeight: 16, includeFontPadding: false },
  gear: { color: colors.cream, fontSize: 26, lineHeight: 36, includeFontPadding: false, textAlign: "center" },
  body: { flex: 1 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.periwinkle,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.periwinkle,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  fabRow: {
    position: "absolute",
    left: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  fabOn: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  fabT: { fontSize: 32, color: "#121428", fontWeight: "700" },
  fabInfo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 7,
    backgroundColor: "#0006",
    borderWidth: 1,
    borderColor: "#ffffff18",
    alignItems: "center",
    justifyContent: "center",
  },
  fabInfoOn: { backgroundColor: colors.pressActive, transform: [{ scale: 0.92 }] },
  infoOverlay: { flex: 1, backgroundColor: "#0008", justifyContent: "center", padding: 24 },
  infoPop: { backgroundColor: colors.ink2, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: "#ffffff18" },
  infoHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { flex: 1, color: colors.cream, fontSize: 15, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  infoBody: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  overlay: { flex: 1, backgroundColor: "#0008", justifyContent: "center", padding: 20 },
  dlg: { backgroundColor: colors.ink2, borderRadius: 20, padding: 16, gap: 8 },
  h: { color: colors.cream, fontSize: 18, fontWeight: "700" },
  muted: { color: colors.muted },
  prow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, backgroundColor: "#ffffff08" },
  prowOn: { backgroundColor: colors.pressActive, transform: [{ scale: 0.98 }] },
  dim: { opacity: 0.55 },
  pend: { borderWidth: 1, borderColor: colors.addBlue },
  picon: { fontSize: 22, width: 36, textAlign: "center" },
  piconWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  pt: { color: colors.cream, fontWeight: "700" },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  check: { backgroundColor: colors.ok },
  addB: { backgroundColor: "#fff", borderWidth: 2, borderColor: colors.addBlue },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8 },
  save: { color: colors.magenta, fontWeight: "800" },
  inp: { backgroundColor: "#0008", color: colors.cream, borderRadius: 10, padding: 10 },
  hint: { color: colors.periwinkle, fontWeight: "700" },
  seg: { flexDirection: "row", gap: 8 },
  segB: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: "#ffffff10", alignItems: "center" },
  segOn: { backgroundColor: colors.periwinkle },
});
