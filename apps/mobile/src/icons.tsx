import { createElement, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { colors } from "./theme";

const PATHS = {
  "music-note":
    "M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V98.75l69.7,20.91A8,8,0,0,0,216,112V64A8,8,0,0,0,210.3,56.34ZM88,216a32,32,0,1,1,32-32A32,32,0,0,1,88,216ZM200,101.25l-64-19.2V50.75L200,70Z",
  pause:
    "M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z",
  play:
    "M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z",
  info:
    "M128,20A28,28,0,1,0,156,48,28,28,0,0,0,128,20Zm20,88V220a20,20,0,0,1-40,0V108a20,20,0,0,1,40,0Z",
} as const;

export type PhName = keyof typeof PATHS;

export function PhIcon({ name, size = 24, color }: { name: PhName; size?: number; color: string }) {
  if (Platform.OS === "web") {
    return createElement("svg", { width: size, height: size, viewBox: "0 0 256 256", fill: color, "aria-hidden": true },
      createElement("path", { d: PATHS[name] }));
  }
  return <NativePh name={name} size={size} color={color} />;
}

function NativePh({ name, size, color }: { name: PhName; size: number; color: string }) {
  if (name === "pause") {
    const w = size * 0.18;
    const h = size * 0.58;
    return (
      <View style={{ width: size, height: size, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: size * 0.14 }}>
        <View style={{ width: w, height: h, borderRadius: 3, borderWidth: 2, borderColor: color }} />
        <View style={{ width: w, height: h, borderRadius: 3, borderWidth: 2, borderColor: color }} />
      </View>
    );
  }
  if (name === "play") {
    const s = size * 0.52;
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 0,
            height: 0,
            marginLeft: size * 0.06,
            borderStyle: "solid",
            borderLeftWidth: s * 0.85,
            borderTopWidth: s * 0.5,
            borderBottomWidth: s * 0.5,
            borderLeftColor: color,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
          }}
        />
      </View>
    );
  }
  if (name === "info") {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: size,
            backgroundColor: color,
            marginBottom: size * 0.1,
          }}
        />
        <View
          style={{
            width: size * 0.16,
            height: size * 0.48,
            borderRadius: size * 0.08,
            backgroundColor: color,
          }}
        />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          width: size * 0.42,
          height: size * 0.3,
          borderRadius: size,
          backgroundColor: color,
          left: size * 0.08,
          bottom: size * 0.12,
          transform: [{ rotate: "-18deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.08,
          height: size * 0.58,
          backgroundColor: color,
          right: size * 0.28,
          top: size * 0.1,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.28,
          height: size * 0.2,
          backgroundColor: color,
          top: size * 0.1,
          right: size * 0.12,
          borderBottomRightRadius: 4,
          borderTopRightRadius: 6,
        }}
      />
    </View>
  );
}

export function IconHit({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.hit,
        hovered ? styles.hitHover : null,
        pressed ? styles.hitActive : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  hitHover: { backgroundColor: colors.pressHover },
  hitActive: { backgroundColor: colors.pressActive, transform: [{ scale: 0.92 }] },
});
