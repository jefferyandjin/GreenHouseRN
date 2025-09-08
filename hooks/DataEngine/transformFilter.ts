/**
 * Transform Filter utility
 *
 * Computes a weighted filtered value over the last up-to-5 samples
 *   y[n] = 0.53125·x[n] + 0.25·x[n−1] + 0.125·x[n−2] + 0.0625·x[n−3] + 0.03125·x[n−4]
 *
 * When fewer than 5 samples exist, compute over available samples with the same coefficients truncated and **renormalized** to sum to 1.0
 *
 * @param samples - newest-first array of sensor values,
 * @returns filtered value
 */
export function transformFilter(samples: number[]): number {
  if (!samples || samples.length === 0) {
    throw new Error("transformFilter requires at least 1 sample");
  }

  const weights = [0.53125, 0.25, 0.125, 0.0625, 0.03125];
  const maxCount = Math.min(samples.length, weights.length); // take the min of available samples or weights to make sure it is <=5

  const selectedWeights = weights.slice(0, maxCount);

  let normalized = selectedWeights;

  if (maxCount < weights.length) {
    // need to renormalize
    const weightSum = selectedWeights.reduce((a, b) => a + b, 0);
    normalized = selectedWeights.map((w) => w / weightSum); // re-calculate each item to renormalize to sum
  }

  let result = 0;
  for (let i = 0; i < maxCount; i++) {
    result += normalized[i] * samples[i];
  }

  return result;
}
