// hooks/DataEngine/types.ts
export interface SensorPayload {
  temperature: number;
  humidity: number;
  co2: number;
  event: string;
  timestamp: number;
}

export enum SensorType {
  TEMPERATURE = "temperature",
  HUMIDITY = "humidity",
  CO2 = "co2",
}

export interface EventPayload {
  type: SensorType;
  event: string;
  timestamp: number;
}

export enum ConnectionState {
  RECONNECTING = "RECONNECTING",
  LIVE = "LIVE",
  OFFLINE = "OFFLINE",
}

export interface SensorRecord {
  temperature: number;
  humidity: number;
  co2: number;
  timestamp: number;
}

export interface DataProvider {
  connect(): void;
  disconnect(): void;
  reSync(): void;
  onDeltaData(cb: (data: SensorPayload) => void): void;
  onSnapshotData(cb: (dataArray: SensorPayload[]) => void): void;
  onStateChange(cb: (state: ConnectionState) => void): void;
}
