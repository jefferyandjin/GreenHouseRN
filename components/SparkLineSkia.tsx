import React, { useMemo, useState } from "react";
import {
  Platform,
  View,
  Text,
  LayoutChangeEvent,
  StyleSheet,
  useColorScheme,
} from "react-native";
import {
  Canvas,
  Path,
  LinearGradient,
  Group,
  Skia,
  matchFont,
  Text as SkiaText,
  DashPathEffect,
  Circle,
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

// ------------------- THEMES -------------------
const lightTheme = {
  containerBg: "#ffffff",
  label: "#374151",
  grid: "#e5e7eb",
  point: "#111827",
};

const darkTheme = {
  containerBg: "#1e293b",
  label: "#f9fafb",
  grid: "#475569",
  point: "#f9fafb",
};

export default function SparklineSkia({
  data,
  label,
  color = "#2563eb", // main line color
  accessibilityLabel,
  width,
  height = DEFAULT_HEIGHT,
  historyDurationMs = DEFAULT_HISTORY_MS,
}: SparklineProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

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
    return matchFont({
      fontFamily,
      fontSize: 6,
      fontStyle: "italic",
      fontWeight: "bold",
    });
  }, []);

  const fontYLabel = useMemo(() => {
    const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" })!;
    return matchFont({
      fontFamily,
      fontSize: 5,
      fontStyle: "normal",
      fontWeight: "normal",
    });
  }, []);

  // Precompute points
  const points = useMemo(() => {
    if (!innerWidth || data.length === 0) return [];
    return data.map((d) => {
      const domain = maxX - minX || 1;
      const x = ((d.timestamp - minX) / domain) * innerWidth + leftLabelWidth;
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
      style={[styles.container, { backgroundColor: theme.containerBg }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
    >
      <Text style={[styles.label, { color: theme.label }]}>{label}</Text>
      {effectiveWidth && innerWidth && (
        <Canvas style={{ width: effectiveWidth, height }}>
          <Group>
            {/* Horizontal grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = paddingY + (i * (height - paddingY * 2)) / 4;
              return (
                <Path
                  key={`gy${i}`}
                  path={Skia.Path.Make()
                    .moveTo(0 + leftLabelWidth, y)
                    .lineTo(innerWidth + leftLabelWidth, y)}
                  color={theme.grid}
                  style="stroke"
                  strokeWidth={1}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
              );
            })}

            {/* Vertical grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = (i * innerWidth) / 4;
              return (
                <Path
                  key={`gx${i}`}
                  path={Skia.Path.Make()
                    .moveTo(x + leftLabelWidth, canvasTopPadding)
                    .lineTo(x + leftLabelWidth, height - canvasTopPadding)}
                  color={theme.grid}
                  style="stroke"
                  strokeWidth={1}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
              );
            })}

            {/* Y-axis labels */}
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
                  color={theme.label}
                />
              );
            })}

            {/* X-axis labels */}
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
                  color={theme.label}
                />
              );
            })}
          </Group>

          {/* Sparkline path */}
          <Path path={path} color={color} style="stroke" strokeWidth={2} />

          {/* Data points */}
          {points.length === 1 && (
            <Circle
              cx={points[0].x}
              cy={points[0].y}
              r={3}
              color={theme.point}
              strokeWidth={1}
            />
          )}

          {points.length > 1 && (
            <>
              <Path path={path} color={color} style="stroke" strokeWidth={2} />
              {points.map((pt, idx) => (
                <Circle
                  key={`pt${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  color={theme.point}
                  strokeWidth={1}
                />
              ))}
            </>
          )}
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
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
  },
});
