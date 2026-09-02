import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  clampStatsName,
  compactPairs,
  MAX_STATS,
  newStatsItem,
  padPairs,
  statsDisplayName,
  statsLabel,
  type StatsItem,
} from "../logic";
import { colors } from "../theme";

export function StatsPane({
  items,
  onChange,
  expanded,
}: {
  items: StatsItem[];
  onChange: (items: StatsItem[]) => void;
  expanded: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const open = items.find((x) => x.id === openId);
  const [draft, setDraft] = useState<{ key: string; value: string }[]>([]);

  function openItem(it: StatsItem) {
    setDraft(padPairs(it.pairs));
    setOpenId(it.id);
    setEditingId(null);
  }

  function commitName(it: StatsItem) {
    onChange(items.map((x) => (x.id === it.id ? { ...x, name: clampStatsName(draftName) } : x)));
    setEditingId(null);
  }

  if (open && expanded) {
    return (
      <View style={styles.face}>
        <View style={styles.top}>
          <Pressable onPress={() => setOpenId(null)}><Text style={styles.link}>←</Text></Pressable>
          <Pressable
            onPress={() => {
              Alert.alert("Save settings", "Save these stats?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Save",
                  onPress: () => {
                    onChange(items.map((x) => (x.id === open.id ? { ...x, pairs: padPairs(compactPairs(draft)) } : x)));
                    setOpenId(null);
                  },
                },
              ]);
            }}
          >
            <Text style={styles.link}>Save</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert("Remove stats", "Delete this stats sheet?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () => {
                    onChange(items.filter((x) => x.id !== open.id));
                    setOpenId(null);
                  },
                },
              ])
            }
          >
            <Text style={styles.danger}>Delete</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {draft.map((p, i) => (
            <View key={i} style={styles.pair}>
              <TextInput
                style={styles.inp}
                placeholder={"key " + (i + 1)}
                placeholderTextColor={colors.muted}
                value={p.key}
                onChangeText={(t) => setDraft(draft.map((x, j) => (j === i ? { ...x, key: t } : x)))}
              />
              <TextInput
                style={styles.inp}
                placeholder={"value " + (i + 1)}
                placeholderTextColor={colors.muted}
                value={p.value}
                onChangeText={(t) => setDraft(draft.map((x, j) => (j === i ? { ...x, value: t } : x)))}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.face, styles.wrap]}>
      {items.map((it, i) => (
        <View key={it.id} style={styles.chip}>
          {editingId === it.id ? (
            <TextInput
              style={styles.chipInput}
              autoFocus
              maxLength={10}
              value={draftName}
              onChangeText={setDraftName}
              onBlur={() => commitName(it)}
              onSubmitEditing={() => commitName(it)}
              selectTextOnFocus
            />
          ) : (
            <Pressable
              style={styles.chipName}
              onPress={() => {
                setDraftName(statsDisplayName(it, i));
                setEditingId(it.id);
              }}
            >
              <Text style={styles.chipT} numberOfLines={1}>{statsDisplayName(it, i)}</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.chipOpen, pressed && styles.pressIcon]}
            onPress={() => openItem(it)}
          >
            <Text style={styles.chipOpenT}>▦</Text>
          </Pressable>
        </View>
      ))}
      {items.length < MAX_STATS ? (
        <Pressable
          style={({ pressed }) => [styles.add, pressed && styles.pressRow]}
          onPress={() => onChange(items.concat(newStatsItem()))}
        >
          <Text style={styles.addT}>+ Add {statsLabel(items.length)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, backgroundColor: colors.ink2 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 10 },
  chip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 14,
    backgroundColor: "#2dd4bf22",
    gap: 4,
  },
  chipName: { flex: 1, minHeight: 36, justifyContent: "center" },
  chipT: { color: colors.cream, fontWeight: "800", letterSpacing: 1 },
  chipInput: {
    flex: 1,
    color: colors.cream,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "#0c0d14",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.teal,
    textAlign: "center",
  },
  chipOpen: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  pressIcon: { backgroundColor: colors.pressActive, transform: [{ scale: 0.92 }] },
  chipOpenT: { color: colors.teal, fontSize: 16 },
  add: { width: "100%", padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: colors.periwinkle, alignItems: "center" },
  pressRow: { backgroundColor: colors.pressActive, transform: [{ scale: 0.98 }] },
  addT: { color: colors.periwinkle, fontWeight: "700" },
  top: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
  link: { color: colors.periwinkle, fontWeight: "700" },
  danger: { color: colors.danger, fontWeight: "700" },
  grid: { padding: 10, gap: 8 },
  pair: { flexDirection: "row", gap: 8 },
  inp: { flex: 1, backgroundColor: "#0008", color: colors.cream, borderRadius: 10, padding: 10 },
});
