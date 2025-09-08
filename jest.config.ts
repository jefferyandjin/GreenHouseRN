import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "react-native",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest", // Transform your TS/TSX files
    "^.+\\.js$": "babel-jest", // Transform JS files
  },
  transformIgnorePatterns: [
    // Ignore everything in node_modules except react-native and RN dependencies
    "node_modules/(?!(react-native|@react-native|@react-navigation)/)",
  ],
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

export default config;
