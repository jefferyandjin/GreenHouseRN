import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, {
  Path,
  LinearGradient,
  Stop,
  Defs,
  Rect,
  Line,
  Text as SvgText,
  Circle,
  G,
} from "react-native-svg";

interface SparklineProps {
  data: { timestamp: number; value: number }[];
  label: string;
  color?: string;
  accessibilityLabel: string;
  width?: number; // optional, auto-measure if not given
  height?: number;
  historyDurationMs?: number;
}

const DEFAULT_HISTORY_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_HEIGHT = 70;

export default function Sparkline({
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
  let measuredOrPropWidth = width ?? measuredWidth ?? 0;
  const effectiveWidth = measuredOrPropWidth - SAFE_PADDING;
  const paddingY = 10;

  // Safe margins for labels
  const leftLabelWidth = 24; // reduced slightly
  const rightMargin = 6;
  const innerWidth = effectiveWidth
    ? effectiveWidth - leftLabelWidth - rightMargin
    : null;

  // X domain: last historyDurationMs
  const times = data.map((d) => d.timestamp);
  const now = times.length > 0 ? Math.max(...times) : Date.now();
  const minX = now - historyDurationMs;
  const maxX = now;

  // Y domain
  const minY = -50;
  const maxY = 50;

  const gridYCount = 4;
  const gridXCount = 4;

  // Scale helpers
  const scaleX = useCallback(
    (t: number) =>
      innerWidth ? ((t - minX) / (maxX - minX || 1)) * innerWidth : 0,
    [innerWidth, minX, maxX]
  );

  const scaleY = useCallback(
    (v: number) =>
      height -
      paddingY -
      ((v - minY) / (maxY - minY || 1)) * (height - paddingY * 2),
    [height, paddingY, minY, maxY]
  );

  const showLine = data.length >= 2 && !!innerWidth;

  // Path
  const pathData = useMemo(() => {
    if (!showLine) return "";
    let d = `M ${scaleX(data[0].timestamp)} ${scaleY(data[0].value)}`;
    for (let i = 1; i < data.length; i++) {
      d += ` L ${scaleX(data[i].timestamp)} ${scaleY(data[i].value)}`;
    }
    return d;
  }, [showLine, data, scaleX, scaleY]);

  // Grid lines Y
  const gridLinesY = useMemo(() => {
    if (!innerWidth) return [];
    const lines: React.ReactNode[] = [];
    const yLabelOffset = 4;
    for (let i = 0; i <= gridYCount; i++) {
      const yValue = minY + ((maxY - minY) * i) / gridYCount;
      const y = scaleY(yValue);
      lines.push(
        <Line
          key={`gy${i}`}
          x1={0}
          x2={innerWidth}
          y1={y}
          y2={y}
          stroke="#e5e7eb"
          strokeDasharray="2,2"
        />,
        <SvgText
          key={`gyLabel${i}`}
          x={-yLabelOffset}
          y={y + 3}
          fontSize={9}
          fill="#64748b"
          textAnchor="end"
          alignmentBaseline="middle"
        >
          {yValue.toFixed(0)}
        </SvgText>
      );
    }
    return lines;
  }, [innerWidth, gridYCount, minY, maxY, scaleY]);

  // Grid lines X
  const gridLinesX = useMemo(() => {
    if (!innerWidth) return [];
    const lines: React.ReactNode[] = [];
    const xLabelOffset = 14;
    for (let i = 0; i <= gridXCount; i++) {
      const tValue = minX + ((maxX - minX) * i) / gridXCount;
      let x = scaleX(tValue);
      // Clamp labels inside chart
      x = Math.max(0, Math.min(x, innerWidth));
      lines.push(
        <Line
          key={`gx${i}`}
          x1={x}
          x2={x}
          y1={paddingY}
          y2={height - paddingY}
          stroke="#e5e7eb"
          strokeDasharray="2,2"
        />,
        <SvgText
          key={`gxLabel${i}`}
          x={x}
          y={height - paddingY + xLabelOffset}
          fontSize={9}
          fill="#64748b"
          textAnchor={i === 0 ? "start" : i === gridXCount ? "end" : "middle"}
          alignmentBaseline="hanging"
        >
          {new Date(tValue).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </SvgText>
      );
    }
    return lines;
  }, [innerWidth, gridXCount, minX, maxX, scaleX, paddingY, height]);

  // Data points
  const dataPoints = useMemo(() => {
    if (!innerWidth) return [];
    return data.map((d, idx) => (
      <Circle
        key={`pt${idx}`}
        cx={scaleX(d.timestamp)}
        cy={scaleY(d.value)}
        r={3}
        fill={color}
        stroke="#fff"
        strokeWidth={1}
      />
    ));
  }, [data, innerWidth, scaleX, scaleY, color]);

  const handleLayout = (e: LayoutChangeEvent) => {
    if (!width) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  const xLabelOffset = 14;

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
        <Svg width={effectiveWidth} height={height + xLabelOffset + 2}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.4} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={effectiveWidth}
            height={height}
            fill="white"
            rx={6}
            ry={6}
          />

          {/* Inner chart group */}
          <G transform={`translate(${leftLabelWidth},0)`}>
            {gridLinesY}
            {gridLinesX}
            {showLine && (
              <Path d={pathData} fill="none" stroke={color} strokeWidth={2} />
            )}
            {dataPoints}
          </G>
        </Svg>
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
