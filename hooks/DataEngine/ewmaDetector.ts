// hooks/DataEngine/ewmaDetector.ts
export interface EWMAState {
  mean: number;
  variance: number;
  initialized: boolean;
}

export function createEWMAState(): EWMAState {
  return { mean: 0, variance: 0, initialized: false };
}

export function updateEWMA(
  state: EWMAState,
  value: number,
  alpha = 0.3 // smoothing factor (0.1–0.3 works well for sensors)
): { zScore: number; isAnomaly: boolean } {
  if (!state.initialized) {
    state.mean = value;
    state.variance = 1e-6; // avoid div-by-zero
    state.initialized = true;
    return { zScore: 0, isAnomaly: false };
  }

  // update mean
  const prevMean = state.mean;
  state.mean = alpha * value + (1 - alpha) * prevMean;

  // update variance (EW variance)
  state.variance =
    alpha * Math.pow(value - state.mean, 2) + (1 - alpha) * state.variance;

  const stdDev = Math.sqrt(state.variance);
  const zScore = stdDev > 1e-6 ? (value - state.mean) / stdDev : 0;

  const isAnomaly = Math.abs(zScore) > 3.0; // threshold

  return { zScore, isAnomaly };
}
