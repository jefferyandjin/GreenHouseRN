// App.tsx
import React, { useState } from "react";
import SplashScreen from "./screens/SplashScreen";
import MainScreen from "./screens/MainScreen";

export default function App() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <SplashScreen onReady={() => setReady(true)} />;
  }

  return <MainScreen />;
}
