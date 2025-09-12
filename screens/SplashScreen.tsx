import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useDatabaseStore } from "../store/databaseStore";

export default function SplashScreen({ onReady }: { onReady: () => void }) {
  const { initDB, loading, error } = useDatabaseStore();

  useEffect(() => {
    initDB();
  }, [initDB]);

  useEffect(() => {
    if (!loading && !error) {
      setTimeout(() => {
        onReady();
      }, 2000);
    }
  }, [loading, error, onReady]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text>Initializing database...</Text>
    </View>
  );
}
