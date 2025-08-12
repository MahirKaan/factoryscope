import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

export type GridCanvasProps = {
  width: number;
  height: number;
  cell: number;
  cols: number;
  rows: number;
  padding: number;
  // Drag/resize sırasında hedeflenen hücre dikdörtgenini vurgulamak için
  highlight?: { col: number; row: number; w: number; h: number; valid: boolean } | null;
};

const GridCanvas: React.FC<GridCanvasProps> = ({ width, height, cell, cols, rows, padding, highlight }) => {
  const gridW = width - padding * 2;
  const gridH = height - padding * 2;

  // --- Micro pulse animasyonu (yakın hücrelerde) ---
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (highlight) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [highlight]);

  const microStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.05 * pulse.value }],
    opacity: 0.06 + 0.08 * pulse.value,
  }));

  // --- Grid çizgisi titreşimi (kenar çizgisi yerine) ---
  const jitter = useSharedValue(0);
  useEffect(() => {
    if (highlight) {
      jitter.value = 0;
      jitter.value = withRepeat(withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(jitter);
      jitter.value = 0;
    }
  }, [highlight]);
  const jitterStyleV = useAnimatedStyle(() => ({
    transform: [{ translateX: (jitter.value - 0.5) * 1.2 }], // ~±0.6px
    opacity: 0.18 + 0.12 * jitter.value,
  }));
  const jitterStyleH = useAnimatedStyle(() => ({
    transform: [{ translateY: (jitter.value - 0.5) * 1.2 }],
    opacity: 0.18 + 0.12 * jitter.value,
  }));

  // Highlight etrafındaki hücreler (pad=1 genişlikte alan)
  const region = useMemo(() => {
    if (!highlight) return null as null | { startR: number; endR: number; startC: number; endC: number };
    const pad = 1;
    const startR = Math.max(0, highlight.row - pad);
    const endR = Math.min(rows - 1, highlight.row + highlight.h + pad - 1);
    const startC = Math.max(0, highlight.col - pad);
    const endC = Math.min(cols - 1, highlight.col + highlight.w + pad - 1);
    return { startR, endR, startC, endC };
  }, [highlight, cols, rows]);

  // Bu bölgede titreşecek dikey/ yatay çizgi koordinatları
  const vLines = useMemo(() => {
    if (!region) return [] as number[];
    // hücre sütun sınırları: startC .. endC+1
    return Array.from({ length: region.endC - region.startC + 2 }, (_, i) => region.startC + i);
  }, [region]);
  const hLines = useMemo(() => {
    if (!region) return [] as number[];
    return Array.from({ length: region.endR - region.startR + 2 }, (_, i) => region.startR + i);
  }, [region]);

  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* SVG tabanlı hafif grid */}
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="gridPattern" width={cell} height={cell} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={cell} height={cell} fill="transparent" stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x={padding} y={padding} width={gridW} height={gridH} fill="url(#gridPattern)" />
      </Svg>

      {/* Micro animasyonlu hücre yüzeyi */}
      {highlight && region && (
        <>
          {Array.from({ length: region.endR - region.startR + 1 }).map((_, ir) => {
            const r = (region!.startR + ir);
            return Array.from({ length: region.endC - region.startC + 1 }).map((__, ic) => {
              const c = (region!.startC + ic);
              return (
                <Animated.View
                  key={`mc-${c}-${r}`}
                  style={[styles.micro, microStyle, {
                    left: padding + c * cell,
                    top: padding + r * cell,
                    width: cell,
                    height: cell,
                    backgroundColor: highlight.valid ? "rgba(79,124,255,0.05)" : "rgba(255,79,100,0.05)",
                  }]}
                />
              );
            });
          })}

          {/* Titreşen grid çizgileri */}
          {vLines.map((c) => (
            <Animated.View
              key={`vl-${c}`}
              style={[styles.vLine, jitterStyleV, {
                left: padding + c * cell,
                top: padding,
                height: gridH,
                backgroundColor: highlight.valid ? "rgba(79,124,255,0.5)" : "rgba(255,79,100,0.5)",
              }]}
            />
          ))}
          {hLines.map((r) => (
            <Animated.View
              key={`hl-${r}`}
              style={[styles.hLine, jitterStyleH, {
                top: padding + r * cell,
                left: padding,
                width: gridW,
                backgroundColor: highlight.valid ? "rgba(79,124,255,0.5)" : "rgba(255,79,100,0.5)",
              }]}
            />
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  micro: {
    position: "absolute",
    borderRadius: 6,
  },
  vLine: {
    position: "absolute",
    width: 1,
  },
  hLine: {
    position: "absolute",
    height: 1,
  },
});

export default memo(GridCanvas);