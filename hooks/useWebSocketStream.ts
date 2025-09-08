import { useEffect, useRef, useState } from "react";

export interface SensorPayload {
  seq: number;
  version: string;
  temperature: number;
  humidity: number;
  co2: number;
  event: string;
  timestamp: number;
}

export enum ConnectionState {
  RECONNECTING = "RECONNECTING",
  LIVE = "LIVE",
  OFFLINE = "OFFLINE",
}

export function useWebSocketStream(wsUrl: string, path = "/") {
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

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(500);
  const closedRef = useRef(false);
  const latestRef = useRef<SensorPayload | null>(null);

  useEffect(() => {
    latestRef.current = latest;
  }, [latest]);

  // Coalesce updates every 200ms (adjust as needed)
  useEffect(() => {
    const interval = setInterval(() => {
      if (latestRef.current !== coalescedLatest) {
        setCoalescedLatest(latestRef.current);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [coalescedLatest]);

  useEffect(() => {
    closedRef.current = false;
    backoffRef.current = 500;

    const connect = () => {
      setState((prev) =>
        prev === ConnectionState.OFFLINE ? ConnectionState.RECONNECTING : prev
      );
      try {
        const ws = new WebSocket(wsUrl + path);
        wsRef.current = ws;

        ws.onopen = () => {
          setState(ConnectionState.LIVE);
          backoffRef.current = 500;
        };

        ws.onmessage = (evt) => {
          try {
            const payload = JSON.parse((evt as any).data) as SensorPayload;
            setLatest(payload);
            if (payload.event && payload.event.length) {
              setEvents((prev) => [payload, ...prev].slice(0, 200));
            }
          } catch (e) {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          setState(ConnectionState.OFFLINE);
          if (!closedRef.current) {
            setReconnectCount((x) => x + 1);
            setState(ConnectionState.RECONNECTING);
            setTimeout(connect, backoffRef.current);
            backoffRef.current = Math.min(backoffRef.current * 2, 8000);
          }
        };

        ws.onerror = () => {
          // let close handle it
        };
      } catch (e) {
        setTimeout(connect, backoffRef.current);
      }
    };

    connect();
    return () => {
      closedRef.current = true;
      wsRef.current && wsRef.current.close();
    };
  }, [wsUrl, path]);

  useEffect(() => {
    const interval = setInterval(() => {
      const latestValue = latestRef.current;
      if (!latestValue) return;
      setHistory((prev) => {
        const now = Date.now();
        const next = [
          ...prev,
          { timestamp: now, value: latestValue.temperature },
        ].filter((p) => now - p.timestamp <= 15 * 60 * 1000); // keep last 15 min
        return next;
      });
    }, 60 * 1000); // every minute

    return () => clearInterval(interval);
  }, []);

  return { latest, coalescedLatest, events, state, reconnectCount, history };
}
