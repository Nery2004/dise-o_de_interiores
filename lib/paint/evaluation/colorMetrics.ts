import { hexToRgbColor, rgbToOklab, type OklabColor, type RgbColor } from "@/lib/colors/colorSpace";
import { hueDistance, oklabChroma, oklabDeltaE, oklabHue } from "@/lib/colors/colorManagement";

export type PaintColorMetrics = {
  midtoneColorError: number;
  hueErrorDegrees: number;
  saturationError: number;
  lightnessError: number;
  shadowColorDeviation: number;
  highlightColorDeviation: number;
  pixelsOutsideTolerance: number;
  sampleCount: number;
};

function rgbAt(data: Uint8ClampedArray, index: number): RgbColor {
  return { r: data[index] / 255, g: data[index + 1] / 255, b: data[index + 2] / 255 };
}

function averageLab(values: OklabColor[]): OklabColor {
  if (!values.length) return { l: 0, a: 0, b: 0 };
  return values.reduce((sum, value) => ({ l: sum.l + value.l / values.length, a: sum.a + value.a / values.length, b: sum.b + value.b / values.length }), { l: 0, a: 0, b: 0 });
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))];
}

export function calculatePaintColorMetrics({
  original,
  rendered,
  maskAlpha,
  targetColor,
  deltaETolerance = 12,
}: {
  original: Uint8ClampedArray;
  rendered: Uint8ClampedArray;
  maskAlpha: Uint8ClampedArray;
  targetColor: string;
  deltaETolerance?: number;
}): PaintColorMetrics {
  if (original.length !== rendered.length || original.length !== maskAlpha.length * 4)
    throw new Error("Rasters incompatibles para métricas de color.");
  const target = rgbToOklab(hexToRgbColor(targetColor));
  const samples: Array<{ original: OklabColor; rendered: OklabColor }> = [];
  for (let index = 0; index < maskAlpha.length; index += 1) {
    if (maskAlpha[index] < 230) continue;
    samples.push({
      original: rgbToOklab(rgbAt(original, index * 4)),
      rendered: rgbToOklab(rgbAt(rendered, index * 4)),
    });
  }
  const luminances = samples.map((sample) => sample.original.l);
  const low = percentile(luminances, 0.25);
  const high = percentile(luminances, 0.75);
  const midtones = samples.filter((sample) => sample.original.l >= Math.max(0.3, low) && sample.original.l <= Math.min(0.9, high));
  const selected = midtones.length >= 8 ? midtones : samples;
  const average = averageLab(selected.map((sample) => sample.rendered));
  const shadowLimit = percentile(luminances, 0.2);
  const highlightLimit = percentile(luminances, 0.8);
  const shadow = averageLab(samples.filter((sample) => sample.original.l <= shadowLimit).map((sample) => sample.rendered));
  const highlight = averageLab(samples.filter((sample) => sample.original.l >= highlightLimit).map((sample) => sample.rendered));
  return {
    midtoneColorError: oklabDeltaE(average, target),
    hueErrorDegrees: hueDistance(oklabHue(average), oklabHue(target)),
    saturationError: Math.abs(oklabChroma(average) - oklabChroma(target)) * 100,
    lightnessError: Math.abs(average.l - target.l) * 100,
    shadowColorDeviation: oklabDeltaE(shadow, target),
    highlightColorDeviation: oklabDeltaE(highlight, target),
    pixelsOutsideTolerance: samples.length ? samples.filter((sample) => oklabDeltaE(sample.rendered, target) > deltaETolerance).length / samples.length : 0,
    sampleCount: samples.length,
  };
}
