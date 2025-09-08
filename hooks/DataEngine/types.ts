// hooks/DataEngine/types.ts
export interface SensorPayload {
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

export interface DataProvider {
  connect(): void;
  disconnect(): void;
  onDeltaData(cb: (data: SensorPayload) => void): void;
  onSnapshotData(cb: (dataArray: SensorPayload[]) => void): void;
  onEvent(cb: (event: SensorPayload) => void): void;
  onStateChange(cb: (state: ConnectionState) => void): void;
}
