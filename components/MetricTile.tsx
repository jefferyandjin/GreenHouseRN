import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";

interface MetricTileProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  warnAbove?: number;
  warnBelow?: number;
  accessibilityLabel: string;
}

export default function MetricTile({
  label,
  value,
  unit,
  warnAbove,
  warnBelow,
  accessibilityLabel,
}: MetricTileProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;

  const isWarn =
    value != null &&
    ((warnAbove !== undefined && value > warnAbove) ||
      (warnBelow !== undefined && value < warnBelow));

  // Continuous background pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(bgPulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Subtle scale pulse on value change
  useEffect(() => {
    if (value == null || !isWarn) return;
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value, isWarn]);

  const normalColor = "#e6fbe6";
  const warnColor = "#fde6e6";
  const baseColor = isWarn ? warnColor : normalColor;
  const highlightColor = isWarn ? "#ffb3b3" : "#b3fcb3";

  const interpolatedBgColor = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor],
  });

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          borderColor: isWarn ? "#c1121f" : "#22c55e",
          borderWidth: 2,
          backgroundColor: interpolatedBgColor,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isWarn && { color: "#c1121f" }]}>
          {value != null ? value.toFixed(1) : "—"}{" "}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
        {isWarn && <Text style={styles.warn}>Threshold exceeded</Text>}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 92,
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    color: "#64748b",
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  unit: {
    fontSize: 12,
    color: "#64748b",
  },
  warn: {
    marginTop: 6,
    color: "#c1121f",
    fontWeight: "700",
    fontSize: 13,
  },
});
