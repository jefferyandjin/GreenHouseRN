import { SensorPayload, SensorRecord } from "../hooks/DataEngine/types"; // wherever your interfaces are

export function payloadsToRecords(payloads: SensorPayload[]): SensorRecord[] {
  return payloads.map((p) => ({
    temperature: p.temperature,
    humidity: p.humidity,
    co2: p.co2,
    timestamp: p.timestamp,
  }));
}
