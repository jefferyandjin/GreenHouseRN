import React, { useMemo, useState } from "react";
import { Platform } from "react-native";
import { View, Text, LayoutChangeEvent, StyleSheet } from "react-native";
import {
  Canvas,
  Path,
  Paint,
  LinearGradient,
  vec,
  Group,
  Skia,
  matchFont,
  Text as SkiaText,
  DashPathEffect,
} from "@shopify/react-native-skia";

interface SparklineProps {
  data: { timestamp: number; value: number }[];
  label: string;
  color?: string;
  accessibilityLabel: string;
  width?: number;
  height?: number;
  historyDurationMs?: number;
}

const DEFAULT_HISTORY_MS = 15 * 60 * 1000;
const DEFAULT_HEIGHT = 70;

export default function SparklineSkia({
  data,
  label,
  color = "#2563eb",
  accessibilityLabel,
  width,
  height = DEFAULT_HEIGHT,
  historyDurationMs = DEFAULT_HISTORY_MS,
}: SparklineProps) {
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const SAFE_PADDING = 20;
  const measuredOrPropWidth = width ?? measuredWidth ?? 0;
  const effectiveWidth = measuredOrPropWidth - SAFE_PADDING;
  const paddingY = 10;
  const leftLabelWidth = 24;
  const rightMargin = 6;
  const innerWidth = effectiveWidth
    ? effectiveWidth - leftLabelWidth - rightMargin
    : null;

  // X domain
  const times = data.map((d) => d.timestamp);
  const now = times.length > 0 ? Math.max(...times) : Date.now();
  const minX = now - historyDurationMs;
  const maxX = now;

  // Y domain
  const minY = -50;
  const maxY = 50;
  const canvasTopPadding = 12;

  const fontXLabel = useMemo(() => {
    const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" })!;
    const fontStyle = {
      fontFamily,
      fontSize: 6,
      fontStyle: "italic" as const,
      fontWeight: "bold" as const,
    };
    return matchFont(fontStyle);
  }, []);

  const fontYLabel = useMemo(() => {
    const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" })!;
    const fontStyle = {
      fontFamily,
      fontSize: 4,
      fontStyle: "normal" as const,
      fontWeight: "normal" as const,
    };
    return matchFont(fontStyle);
  }, []);

  // Precompute points
  const points = useMemo(() => {
    if (!innerWidth || data.length < 2) return [];
    return data.map((d) => {
      const x =
        ((d.timestamp - minX) / (maxX - minX || 1)) * innerWidth +
        leftLabelWidth;
      const y =
        height -
        paddingY -
        ((d.value - minY) / (maxY - minY || 1)) * (height - paddingY * 2);
      return { x, y };
    });
  }, [data, innerWidth, minX, maxX, height]);

  // Build path
  const path = useMemo(() => {
    if (points.length < 2) return Skia.Path.Make();
    const p = Skia.Path.Make();
    p.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((pt) => p.lineTo(pt.x, pt.y));
    return p;
  }, [points]);

  const handleLayout = (e: LayoutChangeEvent) => {
    if (!width) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
    >
      <Text style={styles.label}>{label}</Text>
      {effectiveWidth && innerWidth && (
        <Canvas
          style={{
            width: effectiveWidth,
            height: height,
          }}
        >
          {/* <SkiaText text={label} x={0} y={20} font={font} /> */}
          {/* Background */}
          <Paint color="black" style="fill" />
          {/* Optional: draw axes/grid */}
          <Group>
            {/* Draw grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = paddingY + (i * (height - paddingY * 2)) / 4;
              return (
                <Path
                  key={`gy${i}`}
                  path={Skia.Path.Make()
                    .moveTo(0 + leftLabelWidth, y)
                    .lineTo(innerWidth + leftLabelWidth, y)}
                  color="#e5e7eb"
                  style="stroke"
                  strokeWidth={1}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
              );
            })}
            {/* Draw x grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = (i * innerWidth) / 4;
              return (
                <Path
                  key={`gx${i}`}
                  path={Skia.Path.Make()
                    .moveTo(x + leftLabelWidth, canvasTopPadding)
                    .lineTo(x + leftLabelWidth, height - canvasTopPadding)}
                  color="#e5e7eb"
                  style="stroke"
                  strokeWidth={1}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
              );
            })}
            {/* Draw Y labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = paddingY + (i * (height - paddingY * 2)) / 4;
              const value = Math.round(maxY - (i * (maxY - minY)) / 4);
              return (
                <SkiaText
                  key={`yl${i}`}
                  text={String(value)}
                  x={0 + leftLabelWidth / 2}
                  y={y + 4}
                  font={fontXLabel}
                />
              );
            })}
            {/* Draw X labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = (i * innerWidth) / 4;
              const t = new Date(minX + (i * (maxX - minX)) / 4);
              const label = t.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <SkiaText
                  key={`xl${i}`}
                  text={label}
                  x={x + leftLabelWidth / 2}
                  y={height}
                  font={fontYLabel}
                />
              );
            })}
          </Group>

          {/* Sparkline path */}
          <Path path={path} color={color} style="stroke" strokeWidth={2} />
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    marginBottom: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
});
