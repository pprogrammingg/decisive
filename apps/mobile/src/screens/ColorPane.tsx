import { createElement, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  DELAY_STEP,
  PALETTE,
  SLOT_CORAL,
  SLOT_YELLOW,
  activePalette,
  colorChangeLabel,
  colorSettingsErrors,
  isLightHex,
  lockRequiredSlots,
  nextColorDelayMs,
  nudgeDelay,
  padSlots,
  parseNum,
  pickedColors,
  slotLocked,
  normalizeHex,
  type ColorState,
} from "../logic";
import { useAppState } from "../state/AppStateContext";
import { colors } from "../theme";

export function ColorPane({ color }: { color: ColorState }) {
  const pal = activePalette(color);
  const [hex, setHex] = useState(pal[0]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const next = activePalette(color);
      setHex(next[(Math.random() * next.length) | 0]);
      t = setTimeout(loop, Math.max(80, nextColorDelayMs(color)));
    };
    loop();
    return () => clearTimeout(t);
  }, [color.slots, color.delayLo, color.delayHi]);

  return <View style={[styles.fill, { backgroundColor: hex }]} />;
}

export function ColorSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, update } = useAppState();
  const [slots, setSlots] = useState(lockRequiredSlots(state.color.slots));
  const [lo, setLo] = useState(state.color.delayLo);
  const [hi, setHi] = useState(state.color.delayHi);
  const [edit, setEdit] = useState<number | null>(null);
  useEffect(() => {
    if (!visible) return;
    setSlots(lockRequiredSlots(state.color.slots));
    setLo(state.color.delayLo);
    setHi(state.color.delayHi);
    setEdit(null);
  }, [visible, state.color.slots, state.color.delayLo, state.color.delayHi]);
  const errors = colorSettingsErrors({ slots, delayLo: lo, delayHi: hi });
  const a = parseNum(lo);
  const b = parseNum(hi);
  const summary =
    errors.length || a == null || b == null
      ? ""
      : colorChangeLabel(pickedColors(slots).length, a, b);

  return (
    <>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dlg}>
          <Text style={styles.h}>Color change</Text>
          <View style={styles.grid}>
            {slots.map((hex, i) => (
              <SlotCell
                key={i}
                hex={hex}
                index={i}
                onPick={(h) => setSlots((s) => s.map((x, j) => (j === i ? h : x)))}
                onClear={() => {
                  if (slotLocked(i)) return;
                  setSlots((s) => s.map((x, j) => (j === i ? "" : x)));
                }}
                onNativeEdit={() => setEdit(i)}
              />
            ))}
          </View>
          <Text style={styles.field}>Min (s)</Text>
          <StepRow value={lo} onChange={setLo} />
          <Text style={styles.field}>Max (s)</Text>
          <StepRow value={hi} onChange={setHi} />
          {errors.length
            ? errors.map((msg) => (
                <Text key={msg} style={styles.err}>{msg}</Text>
              ))
            : <Text style={styles.hint}>{summary}</Text>}
          <View style={styles.actions}>
            <Pressable onPress={onClose}><Text style={styles.muted}>Cancel</Text></Pressable>
            <Pressable
              disabled={!!errors.length}
              onPress={() => {
                if (errors.length) return;
                Alert.alert("Save settings", "Save these settings?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Save",
                    onPress: () => {
                      update((s) => {
                        s.color.slots = lockRequiredSlots(slots);
                        s.color.delayLo = lo;
                        s.color.delayHi = hi;
                      });
                      onClose();
                    },
                  },
                ]);
              }}
            >
              <Text style={[styles.save, errors.length ? styles.saveOff : null]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
      <SlotEditor
        index={edit}
        hex={edit == null ? "" : slots[edit]}
        onClose={() => setEdit(null)}
        onPick={(h) => {
          if (edit == null) return;
          if (slotLocked(edit) && !h) return;
          setSlots((s) => s.map((x, j) => (j === edit ? h : x)));
          setEdit(null);
        }}
      />
    </>
  );
}

function SlotCell({
  hex,
  index,
  onPick,
  onClear,
  onNativeEdit,
}: {
  hex: string;
  index: number;
  onPick: (hex: string) => void;
  onClear: () => void;
  onNativeEdit: () => void;
}) {
  const light = hex ? isLightHex(hex) : false;
  return (
    <Pressable
      accessibilityLabel={hex ? "Colour " + (index + 1) : "Pick colour " + (index + 1)}
      onPress={() => {
        if (Platform.OS !== "web") onNativeEdit();
      }}
      style={[styles.cell, hex ? { backgroundColor: hex } : styles.cellEmpty]}
    >
      {Platform.OS === "web"
        ? createElement("input", {
            type: "color",
            value: hex || SLOT_YELLOW,
            "aria-label": hex ? "Colour " + (index + 1) : "Pick colour " + (index + 1),
            onInput: (e: { target: { value: string } }) => onPick(String(e.target.value).toUpperCase()),
            style: {
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              border: 0,
              cursor: "pointer",
            },
          })
        : null}
      {hex && !slotLocked(index) ? (
        <Pressable
          accessibilityLabel="No colour"
          onPress={onClear}
          style={[styles.clear, light ? styles.clearLight : null]}
        >
          <Text style={[styles.clearT, light ? styles.clearTDark : null]}>✕</Text>
        </Pressable>
      ) : hex ? null : (
        <Text style={styles.none}>None</Text>
      )}
    </Pressable>
  );
}

function SlotEditor({
  index,
  hex,
  onClose,
  onPick,
}: {
  index: number | null;
  hex: string;
  onClose: () => void;
  onPick: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(hex || SLOT_YELLOW);
  useEffect(() => {
    setDraft(hex || SLOT_YELLOW);
  }, [hex, index]);
  const presets = [SLOT_YELLOW, SLOT_CORAL, ...PALETTE.filter((p) => p !== SLOT_CORAL)];
  return (
    <Modal visible={index != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dlg}>
          <Text style={styles.h}>Pick a colour</Text>
          <TextInput
            style={styles.inp}
            autoCapitalize="characters"
            value={draft}
            onChangeText={setDraft}
            placeholder="#RRGGBB"
            placeholderTextColor={colors.muted}
          />
          <View style={styles.presets}>
            {presets.map((p) => (
              <Pressable key={p} onPress={() => setDraft(p)} style={[styles.preset, { backgroundColor: p }]} />
            ))}
          </View>
          <View style={styles.actions}>
            {index != null && !slotLocked(index) ? (
              <Pressable onPress={() => onPick("")}><Text style={styles.muted}>No colour</Text></Pressable>
            ) : null}
            <Pressable onPress={onClose}><Text style={styles.muted}>Cancel</Text></Pressable>
            <Pressable
              onPress={() => {
                const h = normalizeHex(draft);
                if (draft.trim() && !h) return;
                onPick(h);
              }}
            >
              <Text style={styles.save}>Use</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function StepRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.step}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(nudgeDelay(value, -DELAY_STEP))}>
        <Text style={styles.stepT}>−</Text>
      </Pressable>
      <TextInput
        style={[styles.inp, { flex: 1 }]}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
      />
      <Pressable style={styles.stepBtn} onPress={() => onChange(nudgeDelay(value, DELAY_STEP))}>
        <Text style={styles.stepT}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "#0008", justifyContent: "center", padding: 20 },
  dlg: { backgroundColor: colors.ink2, borderRadius: 20, padding: 16, gap: 8 },
  h: { color: colors.cream, fontSize: 18, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "31%",
    aspectRatio: 1.35,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff22",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cellEmpty: { backgroundColor: "#ffffff10", borderStyle: "dashed" },
  none: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  clear: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  clearLight: { backgroundColor: "#fffc" },
  clearT: { color: "#fff", fontSize: 12 },
  clearTDark: { color: "#1a1208" },
  field: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  step: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ffffff14",
    alignItems: "center",
    justifyContent: "center",
  },
  stepT: { color: colors.cream, fontSize: 20 },
  inp: { backgroundColor: "#0008", color: colors.cream, borderRadius: 10, padding: 10 },
  hint: { color: colors.periwinkle, fontWeight: "700" },
  err: { color: colors.danger, fontWeight: "650", fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8 },
  muted: { color: colors.muted },
  save: { color: colors.magenta, fontWeight: "800" },
  saveOff: { opacity: 0.38 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#ffffff33" },
});
