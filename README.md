# GreenHouseRN

A React Native (Expo) project for real-time sensor data monitoring, filtering, and anomaly detection. Includes EWMA-based anomaly detection, transform filtering, and snapshot/delta data processing.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Set up mockup server](#set-up-mockup-server)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Design & Trade-offs](#design--trade-offs)
- [License](#license)

---

## Features

- Real-time data ingestion via a `DataProvider` interface.
- Buffered processing of snapshots and delta sensor data.
- Transform filter: weighted smoothing of last 5 samples.
- EWMA z-score anomaly detection.
- Local events emitted on anomalies.
- Temperature history maintained for last 15 minutes.
- Flexible, testable architecture for new detectors.

---

## Requirements

- Node.js ≥ 18
- npm ≥ 9
- Expo CLI (`npm install -g expo-cli`)
- iOS or Android simulator (or physical device)
- Optional: Realm or SQLite if persistent history is needed

---

## Setup

1. **Clone the repository**

```bash
git clone <repo-url> GreenHouseRN
cd GreenHouseRN
```

2. **Install dependencies**

```bash
npm install
```

3. **Clean cache (if needed)**

```bash
rm -rf node_modules
npm install
expo start -c
```

> **Note:** The project uses private class fields in React Native 0.71+. Make sure your `babel.config.js` includes:

```js
plugins: [["@babel/plugin-transform-private-methods", { loose: true }]];
```

---

## Set up mockup server

A mockup server is in GreenHouseMockServer folder to generate simulated senser data over websocket, you will need run 'npm install'
first to install dependencies and run 'npm start' to start the mockup websocket

cd GreenHouseMockServer
npm start

---

## Running the Project

1. **Start Expo Metro bundler**

```bash
npm start
```

2. **Run on device/emulator**

- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Or scan QR code with Expo Go

---

## Testing

1. **Unit Tests**

```bash
npm test
```

- Includes:

  - `processSensorData` sorting, deduplication, gap detection.
  - `transformFilter` weighted smoothing.
  - EWMA anomaly detection tests.

2. **Manual anomaly testing**

- In `useDataEngine`, you can inject artificial spikes to sensor streams to see local events emitted.

---

## Project Structure

```
hooks/
  DataEngine/
    useDataEngine.ts      # Main data engine hook
    utils/
      processSensorData.ts
      transformFilter.ts
      ewmaDetector.ts
      types.ts
screens/
components/
App.tsx
babel.config.js
package.json
```

**Highlights:**

- `useDataEngine.ts` maintains local buffer, filtered values, anomaly events.
- `transformFilter.ts` smooths sensor streams over last 5 samples.
- `ewmaDetector.ts` computes z-score for anomaly detection.
- Snapshot/delta data handled uniformly in buffer.

---

## Design & Trade-offs

- **In-memory buffer:** Keeps last snapshots/deltas for processing; simpler but lost on app restart.
- **Transform filter:** Weighted smoothing of last 5 samples; faster than moving window over full history.
- **EWMA anomaly detector:** Online, streaming detection; parameters can be tuned for sensitivity.
- **History persistence:** Not implemented (could use Realm/SQLite); trade-off between simplicity and reliability across app restarts.
- **Update coalescing:** 200ms interval prevents excessive re-renders.
- **Gap detection:** Detects missing data over 2 seconds; warns on missed samples.
- **Testing:** Unit tests for utilities; full integration requires simulation of provider streams.

---

## License

MIT

```

```
