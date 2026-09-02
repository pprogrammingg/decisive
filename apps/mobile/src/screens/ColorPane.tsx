import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { nextColorDelayMs, paletteForCount, type ColorState } from "../logic";

export function ColorPane({ color }: { color: ColorState }) {
  const [hex, setHex] = useState(paletteForCount(color.count)[0]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const pal = paletteForCount(color.count);
      setHex(pal[(Math.random() * pal.length) | 0]);
      t = setTimeout(loop, Math.max(80, nextColorDelayMs(color)));
    };
    loop();
    return () => clearTimeout(t);
  }, [color.count, color.delayLo, color.delayHi]);

  return <View style={[styles.fill, { backgroundColor: hex }]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
