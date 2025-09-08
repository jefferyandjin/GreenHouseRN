import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Header from "./components/Header";
import MetricTile from "./components/MetricTile";
import Sparkline from "./components/Sparkline";
import DebugPanel from "./components/DebugPanel";
import Spacer from "./components/Spacer";
import EventsList from "./components/EventsList";
import * as ImagePicker from "expo-image-picker";
import FAB from "./components/FAB";
import { addPhotoToQueue } from "./utils/photoQueue";

import { useDataEngine, WebSocketProvider } from "./hooks";

const WS_HOST =
  Platform.OS === "android" ? "ws://10.0.2.2:4000" : "ws://localhost:4000"; //TODO: use env var later

export default function App() {
  const provider = useMemo(() => {
    return new WebSocketProvider(WS_HOST, "/");
  }, []); // only create once

  const { latest, coalescedLatest, events, state, reconnectCount, history } =
    useDataEngine(provider);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          siteName="Greenhouse A1"
          coalescedLatest={coalescedLatest ?? undefined}
          state={state}
        />

        <Spacer size={24} />

        <View style={styles.tilesRow}>
          <MetricTile
            label="Temp"
            value={coalescedLatest?.temperature ?? null}
            unit="°C"
            warnAbove={22}
            accessibilityLabel="Temperature"
          />
          <MetricTile
            label="Humidity"
            value={coalescedLatest?.humidity ?? null}
            unit="%"
            warnBelow={35}
            accessibilityLabel="Humidity"
          />
          <MetricTile
            label="CO₂"
            value={coalescedLatest?.co2 ?? null}
            unit="ppm"
            warnAbove={1200}
            accessibilityLabel="CO2"
          />
        </View>

        <View>
          <Sparkline
            data={history}
            label={"Temperature (°C)"}
            accessibilityLabel={"Temperature over time"}
            height={120}
          />
        </View>

        <View style={styles.eventsBox}>
          <EventsList
            events={events.map((e) => ({
              id: String(e.timestamp),
              message: e.event,
              timestamp: e.timestamp,
            }))}
            accessibilityLabel="Recent anomaly events"
          />
        </View>

        <View style={styles.debugPanelBox}>
          <DebugPanel
            stats={{
              lastEventAgeMs: latest ? Date.now() - latest.timestamp : 0,
              eventsPerSecEma: 0,
              reconnectCount,
              seq: 0,
              version: "1.0.0",
              dupCount: 0,
              gapCount: 0,
            }}
            accessibilityLabel="Debug statistics"
          />
        </View>
      </ScrollView>

      {/* Floating action button (camera) */}
      <FAB
        accessibilityLabel="Capture a plant photo"
        onPress={async () => {
          const res = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            base64: false,
          });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const photo = res.assets[0];
            try {
              await addPhotoToQueue(photo.uri);
            } catch (err) {
              Alert.alert("Error", "Failed to save photo locally.");
            }
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // space for FAB
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 44,
    paddingHorizontal: 16,
  },
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
  small: { fontSize: 12, color: "#334155", marginTop: 6 },
  summary: { marginTop: 8, marginBottom: 12, color: "#334155" },
  tilesRow: { flexDirection: "row", marginBottom: 12 },
  empty: { color: "#64748b" },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  eventText: { color: "#1f2937" },
  eventTime: { color: "#475569" },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  fabText: { color: "#fff", fontSize: 22 },
  eventsBox: {
    maxHeight: 160, // limit size
    marginBottom: 12,
  },
  debugPanelBox: {
    backgroundColor: "transparent",
  },
});
