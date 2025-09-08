import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EventItem {
  id: string;
  message: string;
  timestamp: number;
}

interface EventsListProps {
  events: EventItem[];
  accessibilityLabel?: string;
}

export default function EventsList({
  events,
  accessibilityLabel,
}: EventsListProps) {
  // Show only top 4 events
  const topEvents = events.slice(0, 4);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="list"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.title}>Recent Events</Text>
      {topEvents.map((event) => (
        <View key={event.id} style={styles.item}>
          <Text style={styles.message}>{event.message}</Text>
          <Text style={styles.timestamp}>
            {new Date(event.timestamp).toLocaleTimeString()}
          </Text>
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
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 6,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    // borderBottomWidth: 1,
    // borderBottomColor: "#e5e7eb",
  },
  message: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: 8,
  },
});
