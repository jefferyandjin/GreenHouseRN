import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

interface DebugStats {
  lastEventAgeMs: number;
  eventsPerSecEma: number;
  reconnectCount: number;
  seq: number;
  version: string;
  dupCount: number;
  gapCount: number;
}

interface DebugPanelProps {
  stats: DebugStats;
  accessibilityLabel: string;
}

export default function DebugPanel({
  stats,
  accessibilityLabel,
}: DebugPanelProps) {
  const rows = [
    { label: "Last event age (ms)", value: stats.lastEventAgeMs.toFixed(0) },
    { label: "Events/sec (EMA)", value: stats.eventsPerSecEma.toFixed(2) },
    { label: "Reconnects", value: stats.reconnectCount },
    { label: "Seq", value: stats.seq },
    { label: "Version", value: stats.version },
    { label: "Duplicates", value: stats.dupCount },
    { label: "Gaps", value: stats.gapCount },
  ];

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.heading}>Debug Panel</Text>
      {rows.map((row, idx) => (
        <View style={styles.row} key={idx}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
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
    justifyContent: "flex-start",
  },
  heading: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111827",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    color: "#374151",
  },
  value: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
  },
});
