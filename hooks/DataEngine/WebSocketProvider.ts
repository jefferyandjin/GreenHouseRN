// hooks/DataEngine/WebSocketProvider.ts
import { DataProvider, SensorPayload, ConnectionState } from "./types";

export class WebSocketProvider implements DataProvider {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private path: string;
  private closed = false;
  private backoff = 500;

  private dataCb?: (data: SensorPayload) => void;
  private eventCb?: (event: SensorPayload) => void;
  private stateCb?: (state: ConnectionState) => void;
  private snapshotCb?: (dataArray: SensorPayload[]) => void;

  constructor(wsUrl: string, path = "/") {
    this.wsUrl = wsUrl;
    this.path = path;
  }

  connect() {
    this.closed = false;
    this.backoff = 500;

    const connectInternal = () => {
      this.stateCb?.(ConnectionState.RECONNECTING);

      try {
        this.ws = new WebSocket(this.wsUrl + this.path);

        this.ws.onopen = () => {
          this.stateCb?.(ConnectionState.LIVE);
          this.backoff = 500;
          console.info("WebSocket connected");
        };

        this.ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse((evt as any).data);

            // Handle both snapshot and delta messages
            if (msg.type === "delta") {
              const dataArray: SensorPayload[] = msg.data;
              dataArray.forEach((payload) => {
                this.dataCb?.(payload);
                if (payload.event?.length) {
                  this.eventCb?.(payload);
                }
              });
            } else if (msg.type === "snapshot") {
              const dataArray: SensorPayload[] = msg.data;
              this.snapshotCb?.(dataArray);
            } else {
              console.warn("Unknown message type:", msg.type);
            }
          } catch (err) {
            console.warn("Failed to parse message:", err);
          }
        };

        this.ws.onclose = () => {
          this.stateCb?.(ConnectionState.OFFLINE);
          if (!this.closed) {
            this.stateCb?.(ConnectionState.RECONNECTING);
            setTimeout(connectInternal, this.backoff);
            this.backoff = Math.min(this.backoff * 2, 8000);
          }
        };

        this.ws.onerror = () => {
          // let onclose handle reconnect
        };
      } catch {
        setTimeout(connectInternal, this.backoff);
      }
    };

    connectInternal();
  }

  disconnect() {
    this.closed = true;
    this.ws?.close();
  }

  onDeltaData(cb: (data: SensorPayload) => void) {
    this.dataCb = cb;
  }

  onSnapshotData(cb: (dataArray: SensorPayload[]) => void) {
    this.snapshotCb = cb;
  }

  onEvent(cb: (event: SensorPayload) => void) {
    this.eventCb = cb;
  }

  onStateChange(cb: (state: ConnectionState) => void) {
    this.stateCb = cb;
  }
}
