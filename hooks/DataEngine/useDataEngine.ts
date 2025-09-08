// hooks/DataEngine/useDataEngine.ts
import { useEffect, useRef, useState } from "react";
import { DataProvider, SensorPayload, ConnectionState } from "./types";
import { processSensorData } from "./processSensorData";
import { transformFilter } from "./transformFilter";

export function useDataEngine(provider: DataProvider) {
  const [latest, setLatest] = useState<SensorPayload | null>(null);
  const [coalescedLatest, setCoalescedLatest] = useState<SensorPayload | null>(
    null
  );
  const [events, setEvents] = useState<SensorPayload[]>([]);
  const [state, setState] = useState<ConnectionState>(ConnectionState.OFFLINE);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [history, setHistory] = useState<
    { timestamp: number; value: number }[]
  >([]);

  const [snapshot, setSnapshot] = useState<SensorPayload[]>([]);
  const [buffer, setBuffer] = useState<SensorPayload[]>([]);
  const [processedLatestTimestamp, setProcessedLatestTimestamp] =
    useState<number>(0);

  const latestRef = useRef<SensorPayload | null>(null);
  const bufferRef = useRef<SensorPayload[]>([]);
  const processedTsRef = useRef<number>(0);

  const tempSamplesRef = useRef<number[]>([]);
  const humiditySamplesRef = useRef<number[]>([]);
  const co2SamplesRef = useRef<number[]>([]);

  // keep ref updated
  useEffect(() => {
    latestRef.current = latest;
  }, [latest]);

  // Coalesce updates every 200ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (latestRef.current !== coalescedLatest) {
        setCoalescedLatest(latestRef.current);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Wire provider
  useEffect(() => {
    provider.onDeltaData((payload) => {
      setLatest(payload);
      setBuffer((prev) => [...prev, payload]);
    });
    provider.onSnapshotData((dataArray) => {
      if (dataArray.length > 0) {
        console.log("Received snapshot with", dataArray.length, "items");
        setSnapshot(dataArray);
        setLatest(dataArray[dataArray.length - 1]);
        setBuffer((prev) => [...prev, ...dataArray]); // buffer snapshot
      }
    });
    provider.onEvent((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 200));
    });
    provider.onStateChange((newState) => {
      if (newState === ConnectionState.RECONNECTING) {
        setReconnectCount((x) => x + 1);
      }
      setState(newState);
    });

    provider.connect();
    return () => {
      provider.disconnect();
    };
  }, [provider]);

  // Build temperature history
  useEffect(() => {
    const interval = setInterval(() => {
      const latestValue = latestRef.current;
      if (!latestValue) return;
      setHistory((prev) => {
        const now = Date.now();
        const next = [
          ...prev,
          { timestamp: now, value: latestValue.temperature },
        ].filter((p) => now - p.timestamp <= 15 * 60 * 1000);
        return next;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bufferRef.current = buffer;
  }, [buffer]);

  useEffect(() => {
    processedTsRef.current = processedLatestTimestamp;
  }, [processedLatestTimestamp]);

  // Process buffered data every 200ms
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBuffer = bufferRef.current; // latest buffer snapshot
      const currentProcessedTs = processedTsRef.current; // latest processed timestamp

      if (!currentBuffer || currentBuffer.length === 0) return;

      // console.log("Processing buffer of size", currentBuffer.length);

      const { sanitizedSorted, latestCheckedTimestamp, gapCheckPass } =
        processSensorData(currentProcessedTs ?? 0, 2000, currentBuffer);

      if (!gapCheckPass) {
        console.warn("Gap detected in sensor data!");
      }

      setBuffer([]);

      //TODO, ideally the filter input source should be from database.
      // because if the app is restarted, the in-memory buffer is lost.
      // and we don't know if adding algorithm calculation on real-time incoming data will cause performance issue.
      // For simplicity we use in-memory buffer here.
      // In real app, we should use a local database like realm or sqlite to store recent history.
      // Apply transform filter to each field
      for (const item of sanitizedSorted) {
        // --- Temperature ---
        tempSamplesRef.current.unshift(item.temperature);
        if (tempSamplesRef.current.length > 5) tempSamplesRef.current.pop();
        const filteredTemp = transformFilter(tempSamplesRef.current);

        // --- Humidity ---
        humiditySamplesRef.current.unshift(item.humidity);
        if (humiditySamplesRef.current.length > 5)
          humiditySamplesRef.current.pop();
        const filteredHumidity = transformFilter(humiditySamplesRef.current);

        // --- CO2 ---
        co2SamplesRef.current.unshift(item.co2);
        if (co2SamplesRef.current.length > 5) co2SamplesRef.current.pop();
        const filteredCo2 = transformFilter(co2SamplesRef.current);

        console.log("Filtered values:", {
          temp: filteredTemp,
          humidity: filteredHumidity,
          co2: filteredCo2,
        });
      }

      setProcessedLatestTimestamp(latestCheckedTimestamp);

      console.log(
        "Processed",
        sanitizedSorted.length,
        "items",
        "processedLatestTimestamp:",
        latestCheckedTimestamp
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []); // run once

  return { latest, coalescedLatest, events, state, reconnectCount, history };
}
