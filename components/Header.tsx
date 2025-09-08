import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ConnectionState } from "../hooks/useWebSocketStream";

interface HeaderProps {
  siteName: string;
  coalescedLatest?: {
    temperature: number;
    humidity: number;
    co2: number;
    timestamp: number;
  };
  state: ConnectionState;
}

export default function Header({
  siteName,
  coalescedLatest,
  state,
}: HeaderProps) {
  const lastSnapshot = coalescedLatest?.timestamp;

  const statusSummary = useMemo(() => {
    if (!coalescedLatest) return "Waiting for data...";
    const issues: string[] = [];
    if (coalescedLatest.temperature > 22) issues.push("High temperature");
    if (coalescedLatest.co2 > 1200) issues.push("High CO₂");
    if (coalescedLatest.humidity < 35) issues.push("Low humidity");
    return issues.length ? issues.join(" • ") : "All readings normal";
  }, [coalescedLatest]);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.siteName}>{siteName}</Text>
        <Text style={styles.summary}>{statusSummary}</Text>
      </View>

      <View style={styles.headerRight}>
        <Text
          accessibilityRole="text"
          accessibilityLabel={`Connection ${state}`}
          style={[
            styles.statusPill,
            state === ConnectionState.LIVE
              ? styles.live
              : state === ConnectionState.RECONNECTING
              ? styles.reconnecting
              : styles.offline,
          ]}
        >
          {state}
        </Text>
        <Text style={styles.small}>
          Last:{" "}
          {lastSnapshot ? new Date(lastSnapshot).toLocaleTimeString() : "-"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  siteName: { fontSize: 22, fontWeight: "700" },
  headerRight: { alignItems: "flex-end" },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: "#fff",
    fontWeight: "700",
  },
  live: { backgroundColor: "#0a7d28" },
  reconnecting: { backgroundColor: "#b07d00" },
  offline: { backgroundColor: "#9b1c1c" },
  small: { fontSize: 12, color: "#334155", marginTop: 6 },
  summary: { marginTop: 8, marginBottom: 12, color: "#334155" },
});
