import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FABProps {
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
}

export default function FAB({ onPress, accessibilityLabel }: FABProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="camera" size={28} color="white" />
      </TouchableOpacity>
      <Text style={styles.hint}>Capture</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 28,
    right: 28,
    alignItems: "center",
    zIndex: 20,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: "#374151",
  },
});
