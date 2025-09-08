import React from "react";
import { View } from "react-native";

export default function Spacer({ size = 12 }) {
  return <View style={{ height: size }} />;
}
