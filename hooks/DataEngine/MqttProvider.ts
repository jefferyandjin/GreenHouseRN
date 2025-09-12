// hooks/DataEngine/MqttProvider.ts
import { DataProvider, SensorPayload, ConnectionState } from "./types";

export class MqttProvider implements DataProvider {
  onDeltaData(cb: (data: SensorPayload) => void): void {
    throw new Error("Method not implemented.");
  }
  onSnapshotData(cb: (dataArray: SensorPayload[]) => void): void {
    throw new Error("Method not implemented.");
  }
  connect(): void {
    // TODO: implement MQTT connection
    throw new Error("MqttProvider.connect not implemented yet");
  }

  disconnect(): void {
    // TODO: implement MQTT disconnect
  }

  reSync(): void {
    // TODO: implement MQTT resync
  }

  onStateChange(cb: (state: ConnectionState) => void): void {
    // TODO: wire MQTT connection state to cb
  }
}
