// hooks/DataEngine/utils/processSensorData.test.ts
import { processSensorData } from "./processSensorData";
import { SensorPayload } from "./types";

describe("processSensorData", () => {
  const baseTs = 1000;
  const gapAllowed = 1000;

  const createPayload = (ts: number): SensorPayload => ({
    timestamp: ts,
    temperature: 20,
    humidity: 50,
    co2: 800,
    event: "",
  });

  it("should sort and remove duplicates, discarding old items", () => {
    const input = [
      createPayload(2000),
      createPayload(1500),
      createPayload(2000), // duplicate
      createPayload(500), // older than baseTs
    ];

    const { sanitizedSorted } = processSensorData(baseTs, gapAllowed, input);
    expect(sanitizedSorted.map((x) => x.timestamp)).toEqual([1500, 2000]);
  });

  it("should pass gap check when no gaps exceed gapAllowed", () => {
    const input = [
      createPayload(1100),
      createPayload(1500),
      createPayload(1900),
    ];
    const { latestCheckedTimestamp, gapCheckPass } = processSensorData(
      baseTs,
      gapAllowed,
      input
    );
    expect(gapCheckPass).toBe(true);
    expect(latestCheckedTimestamp).toBe(1900);
  });

  it("should fail gap check and reset latestCheckedTimestamp when a gap is too large", () => {
    const input = [createPayload(1100), createPayload(2500)]; // gap 1400 > 1000
    const { latestCheckedTimestamp, gapCheckPass } = processSensorData(
      baseTs,
      gapAllowed,
      input
    );
    expect(gapCheckPass).toBe(false);
    expect(latestCheckedTimestamp).toBe(baseTs);
  });

  it("should handle empty input", () => {
    const { sanitizedSorted, latestCheckedTimestamp, gapCheckPass } =
      processSensorData(baseTs, gapAllowed, []);
    expect(sanitizedSorted).toEqual([]);
    expect(latestCheckedTimestamp).toBe(baseTs);
    expect(gapCheckPass).toBe(true);
  });
});
