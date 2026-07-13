import { rgbDeltaE } from "@/lib/colors/colorManagement";

export function calculatePreviewExportDifference(preview: Uint8ClampedArray, exported: Uint8ClampedArray, alpha: Uint8ClampedArray) {
  if (preview.length !== exported.length || preview.length !== alpha.length * 4) throw new Error("Rasters incompatibles para comparar preview y exportación.");
  let total = 0; let maximum = 0; let samples = 0;
  for (let index = 0; index < alpha.length; index += 1) {
    if (alpha[index] < 16) continue;
    const offset = index * 4;
    const difference = rgbDeltaE(
      { r: preview[offset] / 255, g: preview[offset + 1] / 255, b: preview[offset + 2] / 255 },
      { r: exported[offset] / 255, g: exported[offset + 1] / 255, b: exported[offset + 2] / 255 },
    );
    total += difference; maximum = Math.max(maximum, difference); samples += 1;
  }
  const meanDeltaE = samples ? total / samples : 0;
  return { meanDeltaE, maximumDeltaE: maximum, previewExportDifferenceScore: Math.min(100, meanDeltaE * 5) };
}
