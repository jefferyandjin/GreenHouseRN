// hooks/DataEngine/utils/processSensorData.ts
import { SensorPayload } from "./types";

export interface ProcessedDataResult {
  sanitizedSorted: SensorPayload[];
  latestCheckedTimestamp: number;
  gapCheckPass: boolean;
}

/**
 * Sorts, check duplicates, removes old items, checks for gaps.
 * @param baseTimestamp - Only keep items with timestamp >= baseTimestamp
 * @param gapAllowed - Maximum allowed gap in ms
 * @param arr - Input sensor payload array (unsorted, may contain duplicates)
 */
export function processSensorData(
  baseTimestamp: number,
  gapAllowed: number,
  arr: SensorPayload[]
): ProcessedDataResult {
  // sort and discard old and duplicates
  const map = new Map<number, SensorPayload>();
  for (const item of arr) {
    if (item.timestamp < baseTimestamp) continue; // discard old
    if (!map.has(item.timestamp)) map.set(item.timestamp, item); // dedupe
  }
  const sanitizedSorted = Array.from(map.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  //check for gaps
  let lastTs = baseTimestamp;
  let gapCheckPass = true;

  // if baseTimestamp=0, skip gap check for initial load
  for (const item of sanitizedSorted) {
    if (item.timestamp - lastTs > gapAllowed && lastTs !== 0) {
      gapCheckPass = false;
      lastTs = baseTimestamp; // reset to base
      break;
    }
    lastTs = item.timestamp;
  }

  return { sanitizedSorted, latestCheckedTimestamp: lastTs, gapCheckPass };
}
