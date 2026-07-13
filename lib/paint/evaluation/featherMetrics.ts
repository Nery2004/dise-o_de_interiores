export type FeatherMetrics = {
  transitionPixelCount: number;
  weightedLeakagePixels: number;
  maximumTransitionWidth: number;
  symmetryError: number;
  discontinuityCount: number;
};

export function calculateFeatherMetrics(feathered: Uint8ClampedArray, binary: Uint8ClampedArray, width: number, height: number): FeatherMetrics {
  if (feathered.length !== binary.length || binary.length !== width * height) throw new Error("Máscaras incompatibles para métricas de feather.");
  let transitionPixelCount = 0; let weightedLeakagePixels = 0; let discontinuityCount = 0; let maximumTransitionWidth = 0;
  for (let y = 0; y < height; y += 1) {
    let rowTransition = 0;
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const value = feathered[index];
      if (value > 0 && value < 255) { transitionPixelCount += 1; rowTransition += 1; }
      if (!binary[index]) weightedLeakagePixels += value / 255;
      if (x > 0 && Math.abs(value - feathered[index - 1]) > 96) discontinuityCount += 1;
    }
    maximumTransitionWidth = Math.max(maximumTransitionWidth, rowTransition / 2);
  }
  let symmetryTotal = 0; let symmetrySamples = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < Math.floor(width / 2); x += 1) {
    symmetryTotal += Math.abs(feathered[y * width + x] - feathered[y * width + (width - 1 - x)]) / 255;
    symmetrySamples += 1;
  }
  return { transitionPixelCount, weightedLeakagePixels, maximumTransitionWidth, symmetryError: symmetrySamples ? symmetryTotal / symmetrySamples : 0, discontinuityCount };
}
