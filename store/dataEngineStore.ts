// store/dataEngineStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  DataProvider,
  SensorPayload,
  ConnectionState,
  EventPayload,
  SensorType,
} from "../hooks/DataEngine/types";
import { processSensorData } from "../hooks/DataEngine/processSensorData";
import { transformFilter } from "../hooks/DataEngine/transformFilter";
import {
  EWMAState,
  createEWMAState,
  updateEWMA,
} from "../hooks/DataEngine/ewmaDetector";
import { useDatabaseStore } from "./databaseStore";
import { payloadsToRecords } from "../utils/dataConversion";

interface DataEngineState {
  latest: SensorPayload | null;
  coalescedLatest: SensorPayload | null;
  events: EventPayload[];
  state: ConnectionState;
  reconnectCount: number;
  dupCount: number;
  gapCount: number;
  history: { timestamp: number; value: number }[];

  buffer: SensorPayload[];
  processedLatestTimestamp: number;

  // Actions
  setLatest: (payload: SensorPayload) => void;
  addEvent: (event: EventPayload) => void;
  setState: (state: ConnectionState) => void;
  incrementReconnect: () => void;
  incrementGap: () => void;
  addToBuffer: (payload: SensorPayload | SensorPayload[]) => void;
  setProcessedLatestTimestamp: (ts: number) => void;
  setHistory: (history: { timestamp: number; value: number }[]) => void;
  processBuffer: () => void;

  // Initialization
  initProvider: (provider: DataProvider) => void;
}

export const useDataEngineStore = create<DataEngineState>()(
  devtools((set, get) => {
    // EWMA and sample refs (non-reactive)
    const tempSamples: number[] = [];
    const humiditySamples: number[] = [];
    const co2Samples: number[] = [];

    const tempEWMA = createEWMAState();
    const humidityEWMA = createEWMAState();
    const co2EWMA = createEWMAState();

    let coalesceInterval: NodeJS.Timer;
    let historyInterval: NodeJS.Timer;
    let bufferInterval: NodeJS.Timer;

    return {
      latest: null,
      coalescedLatest: null,
      events: [],
      state: ConnectionState.OFFLINE,
      reconnectCount: 0,
      dupCount: 0,
      gapCount: 0,
      history: [],
      buffer: [],
      processedLatestTimestamp: 0,

      setLatest: (payload) => set({ latest: payload }),
      addEvent: (event) =>
        set((state) => ({ events: [event, ...state.events] })),
      setState: (stateVal) => set({ state: stateVal }),
      incrementReconnect: () =>
        set((state) => ({ reconnectCount: state.reconnectCount + 1 })),
      incrementGap: () => set((state) => ({ gapCount: get().gapCount + 1 })),
      addToBuffer: (payload) => {
        if (Array.isArray(payload)) {
          set((state) => ({ buffer: [...state.buffer, ...payload] }));
        } else {
          set((state) => ({ buffer: [...state.buffer, payload] }));
        }
      },
      setProcessedLatestTimestamp: (ts) =>
        set({ processedLatestTimestamp: ts }),
      setHistory: (history) => set({ history }),

      processBuffer: () => {
        const buffer = get().buffer;
        const processedTs = get().processedLatestTimestamp;
        if (!buffer || buffer.length === 0) return;

        const { sanitizedSorted, latestCheckedTimestamp, gapCheckPass } =
          processSensorData(processedTs ?? 0, 2000, buffer);

        if (!gapCheckPass) {
          console.warn("Gap detected in sensor data!");
          get().incrementGap();
        }

        set({ buffer: [] });

        useDatabaseStore
          .getState()
          .addSensorRecords(payloadsToRecords(sanitizedSorted));

        sanitizedSorted.forEach((item) => {
          // --- Temperature ---
          tempSamples.unshift(item.temperature);
          if (tempSamples.length > 5) tempSamples.pop();
          const filteredTemp = transformFilter(tempSamples);

          // --- Humidity ---
          humiditySamples.unshift(item.humidity);
          if (humiditySamples.length > 5) humiditySamples.pop();
          const filteredHumidity = transformFilter(humiditySamples);

          // --- CO2 ---
          co2Samples.unshift(item.co2);
          if (co2Samples.length > 5) co2Samples.pop();
          const filteredCo2 = transformFilter(co2Samples);

          // --- EWMA anomaly detection ---
          const tempResult = updateEWMA(tempEWMA, filteredTemp, 2);
          const humidityResult = updateEWMA(humidityEWMA, filteredHumidity, 1);
          const co2Result = updateEWMA(co2EWMA, filteredCo2, 1);

          if (tempResult.isAnomaly) {
            console.warn("Temp anomaly!", filteredTemp, tempResult.zScore);
            get().addEvent({
              event: `Temperature anomaly: ${filteredTemp.toFixed(
                1
              )}°C (z=${tempResult.zScore.toFixed(2)})`,
              type: SensorType.TEMPERATURE,
              timestamp: item.timestamp,
            });
          }
          if (humidityResult.isAnomaly) {
            console.warn(
              "Humidity anomaly!",
              filteredHumidity,
              humidityResult.zScore
            );
          }
          if (co2Result.isAnomaly) {
            console.warn("CO2 anomaly!", filteredCo2, co2Result.zScore);
          }
        });

        get().setProcessedLatestTimestamp(latestCheckedTimestamp);
      },

      initProvider: (provider) => {
        // Wire provider events
        provider.onDeltaData((payload) => {
          get().setLatest(payload);
          get().addToBuffer(payload);

          set((state) => {
            const history = state.history.length
              ? state.history
              : [{ timestamp: payload.timestamp, value: payload.temperature }];
            return { history };
          });
        });

        provider.onSnapshotData((dataArray) => {
          if (dataArray.length > 0) {
            console.log("Received snapshot with", dataArray.length, "items");
            get().setLatest(dataArray[dataArray.length - 1]);
            get().addToBuffer(dataArray);
          }
        });

        provider.onStateChange((newState) => {
          if (newState === ConnectionState.RECONNECTING) {
            get().incrementReconnect();
          }
          get().setState(newState);
        });

        provider.connect();

        // --- Coalesce updates every 200ms ---
        coalesceInterval = setInterval(() => {
          if (get().latest !== get().coalescedLatest) {
            set({ coalescedLatest: get().latest });
          }
        }, 200);

        // --- Build temperature history every 60s ---
        historyInterval = setInterval(() => {
          const latest = get().latest;
          if (!latest) return;

          set((state) => {
            const nextHistory = [
              ...state.history,
              { timestamp: latest.timestamp, value: latest.temperature },
            ].filter((p) => latest.timestamp - p.timestamp <= 15 * 60 * 1000);
            return { history: nextHistory };
          });
        }, 60 * 1000);

        // --- Process buffer every 1s ---
        bufferInterval = setInterval(() => {
          get().processBuffer();
        }, 1000);

        return () => {
          provider.disconnect();
          clearInterval(coalesceInterval as any);
          clearInterval(historyInterval as any);
          clearInterval(bufferInterval as any);
        };
      },
    };
  })
);
