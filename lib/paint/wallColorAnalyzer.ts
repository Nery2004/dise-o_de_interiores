import {
  rgbColorToHex,
  rgbToHslColor,
  rgbToOklab,
  type RgbColor,
} from "@/lib/colors/colorSpace";
import type { FeatheredMask } from "@/lib/paint/MaskFeatherPass";
import type { SourceRaster } from "@/lib/paint/imageRaster";
import type { RenderQuality, WallColorProfile } from "@/types/editor";

export const WHITE_BASE_ANALYSIS_VERSION = 1;

type Sample = {
  alpha: number;
  hue: number;
  luminance: number;
  oklabA: number;
  oklabB: number;
  rgb: RgbColor;
  saturation: number;
};

export type WallColorAnalysis = {
  analysisVersion: number;
  averageColor: string;
  medianColor: string;
  averageLuminance: number;
  averageSaturation: number;
  dominantHue?: number;
  darkPixelRatio: number;
  lightPixelRatio: number;
  profile: WallColorProfile;
  sampleCount: number;
  luminanceHistogram: number[];
  saturationHistogram: number[];
  hueHistogram: number[];
};

const MAXIMUM_SAMPLES: Record<RenderQuality, number> = {
  draft: 1_500,
  high: 6_000,
  ultra: 20_000,
};

export function percentile(values: number[], amount: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((sorted.length - 1) * amount)),
  );
  return sorted[index];
}

export function trimmedMean(values: number[], trimRatio = 0.1) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  const trim = Math.min(
    Math.floor(sorted.length * trimRatio),
    Math.floor((sorted.length - 1) / 2),
  );
  const selected = sorted.slice(trim, sorted.length - trim || undefined);
  return selected.reduce((total, value) => total + value, 0) / selected.length;
}

export function classifyWallColor({
  averageLuminance,
  averageSaturation,
  dominantHue,
  sampleCount,
}: Pick<
  WallColorAnalysis,
  "averageLuminance" | "averageSaturation" | "dominantHue" | "sampleCount"
>): WallColorProfile {
  if (sampleCount < 12) return "unknown";
  if (averageSaturation >= 0.5) return "saturated";
  const light = averageLuminance >= 0.63;
  if (averageSaturation < 0.13 || dominantHue === undefined) {
    return light ? "neutral-light" : "neutral-dark";
  }
  const warm = dominantHue <= 85 || dominantHue >= 330;
  return warm
    ? light
      ? "warm-light"
      : "warm-dark"
    : light
      ? "cool-light"
      : "cool-dark";
}

function incrementHistogram(histogram: number[], value: number, maximum: number) {
  const index = Math.min(
    histogram.length - 1,
    Math.max(0, Math.floor((value / maximum) * histogram.length)),
  );
  histogram[index] += 1;
}

function medianColor(samples: Sample[]) {
  return rgbColorToHex({
    r: percentile(samples.map((sample) => sample.rgb.r), 0.5),
    g: percentile(samples.map((sample) => sample.rgb.g), 0.5),
    b: percentile(samples.map((sample) => sample.rgb.b), 0.5),
  });
}

function dominantHueFromHistogram(histogram: number[]) {
  const maximum = Math.max(...histogram);
  if (maximum <= 0) return undefined;
  const index = histogram.indexOf(maximum);
  return ((index + 0.5) / histogram.length) * 360;
}

export function analyzeWallPixels({
  mask,
  quality,
  signal,
  source,
}: {
  mask: FeatheredMask;
  quality: RenderQuality;
  signal?: AbortSignal;
  source: SourceRaster;
}): WallColorAnalysis {
  const samples: Sample[] = [];
  const maximumSamples = MAXIMUM_SAMPLES[quality];
  const step = Math.max(
    1,
    Math.ceil(Math.sqrt((mask.bounds.width * mask.bounds.height) / maximumSamples)),
  );

  for (let y = mask.bounds.y; y < mask.bounds.y + mask.bounds.height; y += step) {
    if (signal?.aborted) throw new DOMException("Analysis cancelled", "AbortError");
    for (let x = mask.bounds.x; x < mask.bounds.x + mask.bounds.width; x += step) {
      const maskAlpha = mask.alpha[y * mask.width + x];
      if (maskAlpha < 64) continue;
      const pixelIndex = (y * source.width + x) * 4;
      const rgb = {
        r: source.data[pixelIndex] / 255,
        g: source.data[pixelIndex + 1] / 255,
        b: source.data[pixelIndex + 2] / 255,
      };
      const hsl = rgbToHslColor(rgb);
      const oklab = rgbToOklab(rgb);
      const perceptualSaturation =
        hsl.s * Math.min(1, Math.max(0, (1 - hsl.l) / 0.3));
      samples.push({
        alpha: maskAlpha / 255,
        hue: hsl.h,
        luminance: oklab.l,
        oklabA: oklab.a,
        oklabB: oklab.b,
        rgb,
        saturation: perceptualSaturation,
      });
    }
  }

  if (samples.length === 0) {
    return {
      analysisVersion: WHITE_BASE_ANALYSIS_VERSION,
      averageColor: "#808080",
      medianColor: "#808080",
      averageLuminance: 0.5,
      averageSaturation: 0,
      darkPixelRatio: 0,
      lightPixelRatio: 0,
      profile: "unknown",
      sampleCount: 0,
      luminanceHistogram: Array(20).fill(0),
      saturationHistogram: Array(20).fill(0),
      hueHistogram: Array(24).fill(0),
    };
  }

  const luminances = samples.map((sample) => sample.luminance);
  const saturations = samples.map((sample) => sample.saturation);
  const lowerLuminance = Math.max(0.08, percentile(luminances, 0.08));
  const upperLuminance = Math.min(0.96, percentile(luminances, 0.92));
  const saturationLimit = Math.max(0.18, percentile(saturations, 0.85));
  const moderate = samples.filter(
    (sample) =>
      sample.luminance >= lowerLuminance &&
      sample.luminance <= upperLuminance &&
      (sample.saturation <= saturationLimit || sample.saturation < 0.5),
  );
  const candidates = moderate.length >= 12 ? moderate : samples;
  const medianA = percentile(candidates.map((sample) => sample.oklabA), 0.5);
  const medianB = percentile(candidates.map((sample) => sample.oklabB), 0.5);
  const distances = candidates.map((sample) =>
    Math.hypot(sample.oklabA - medianA, sample.oklabB - medianB),
  );
  const distanceLimit = Math.max(0.035, percentile(distances, 0.82));
  const robust = candidates.filter(
    (sample) =>
      Math.hypot(sample.oklabA - medianA, sample.oklabB - medianB) <=
      distanceLimit,
  );
  const selected = robust.length >= 12 ? robust : candidates;
  const luminanceHistogram = Array(20).fill(0) as number[];
  const saturationHistogram = Array(20).fill(0) as number[];
  const hueHistogram = Array(24).fill(0) as number[];
  selected.forEach((sample) => {
    incrementHistogram(luminanceHistogram, sample.luminance, 1);
    incrementHistogram(saturationHistogram, sample.saturation, 1);
    if (sample.saturation >= 0.05) {
      const hueIndex = Math.min(23, Math.floor(sample.hue / 15));
      hueHistogram[hueIndex] += Math.min(0.5, sample.saturation) * sample.alpha;
    }
  });
  const dominantHue = dominantHueFromHistogram(hueHistogram);
  const averageLuminance = trimmedMean(
    selected.map((sample) => sample.luminance),
  );
  const averageSaturation = trimmedMean(
    selected.map((sample) => sample.saturation),
  );
  const analysis = {
    analysisVersion: WHITE_BASE_ANALYSIS_VERSION,
    averageColor: rgbColorToHex({
      r: trimmedMean(selected.map((sample) => sample.rgb.r)),
      g: trimmedMean(selected.map((sample) => sample.rgb.g)),
      b: trimmedMean(selected.map((sample) => sample.rgb.b)),
    }),
    medianColor: medianColor(selected),
    averageLuminance,
    averageSaturation,
    dominantHue,
    darkPixelRatio:
      samples.filter((sample) => sample.luminance < 0.18).length / samples.length,
    lightPixelRatio:
      samples.filter((sample) => sample.luminance > 0.92).length / samples.length,
    sampleCount: selected.length,
    luminanceHistogram,
    saturationHistogram,
    hueHistogram,
  };
  return { ...analysis, profile: classifyWallColor(analysis) };
}
