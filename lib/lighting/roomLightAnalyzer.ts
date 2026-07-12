import { clamp, normalizeDirection } from "@/lib/lighting/lightProfile";
import type { RoomLightProfile, RoomLightingSample } from "@/types/lighting";

export type PixelSource = Pick<ImageData, "data" | "width" | "height">;
export type PixelRegion = { x: number; y: number; width: number; height: number };

function pixelMetrics(data: Uint8ClampedArray, offset: number) {
  const r = data[offset] / 255;
  const g = data[offset + 1] / 255;
  const b = data[offset + 2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return {
    luminance: r * 0.2126 + g * 0.7152 + b * 0.0722,
    saturation: max <= 0 ? 0 : (max - min) / max,
    temperature: (r - b) * 100,
    tint: (r + b - 2 * g) * 50,
  };
}

function sampleStep(source: PixelSource, targetSamples = 12_000) {
  return Math.max(1, Math.floor(Math.sqrt((source.width * source.height) / targetSamples)));
}

export function estimateLightDirection(
  source: PixelSource,
  region?: PixelRegion,
) {
  const area = region ?? { x: 0, y: 0, width: source.width, height: source.height };
  const x0 = Math.max(0, Math.floor(area.x));
  const y0 = Math.max(0, Math.floor(area.y));
  const x1 = Math.min(source.width, Math.ceil(area.x + area.width));
  const y1 = Math.min(source.height, Math.ceil(area.y + area.height));
  const step = sampleStep(source, 8_000);
  let weightedX = 0;
  let weightedY = 0;
  let total = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const offset = (y * source.width + x) * 4;
      if (source.data[offset + 3] < 16) continue;
      const luminance = pixelMetrics(source.data, offset).luminance;
      const weight = Math.max(0, luminance - 0.48) ** 2;
      weightedX += x * weight;
      weightedY += y * weight;
      total += weight;
    }
  }
  if (total < 0.0001) return { x: 0, y: 1 };
  const brightX = weightedX / total;
  const brightY = weightedY / total;
  return normalizeDirection({
    x: x0 + (x1 - x0) / 2 - brightX,
    y: y0 + (y1 - y0) / 2 - brightY,
  });
}

export function estimateRoomTemperature(source: PixelSource, region?: PixelRegion) {
  return sampleLighting(source, region).temperature;
}

export function sampleLighting(
  source: PixelSource,
  region?: PixelRegion,
): RoomLightingSample {
  const area = region ?? { x: 0, y: 0, width: source.width, height: source.height };
  const x0 = Math.max(0, Math.floor(area.x));
  const y0 = Math.max(0, Math.floor(area.y));
  const x1 = Math.min(source.width, Math.ceil(area.x + area.width));
  const y1 = Math.min(source.height, Math.ceil(area.y + area.height));
  const step = sampleStep(source);
  const samples: Array<ReturnType<typeof pixelMetrics>> = [];
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const offset = (y * source.width + x) * 4;
      if (source.data[offset + 3] < 16) continue;
      const metrics = pixelMetrics(source.data, offset);
      if (metrics.luminance < 0.025 || metrics.luminance > 0.975 || metrics.saturation > 0.92) continue;
      samples.push(metrics);
    }
  }
  if (!samples.length)
    return { luminance: 0.5, contrast: 0.25, saturation: 0.25, temperature: 0, tint: 0, sharpness: 0.5, validPixelRatio: 0 };
  samples.sort((a, b) => a.luminance - b.luminance);
  const trim = Math.floor(samples.length * 0.1);
  const kept = samples.slice(trim, Math.max(trim + 1, samples.length - trim));
  const mean = (key: keyof (typeof kept)[number]) => kept.reduce((sum, item) => sum + item[key], 0) / kept.length;
  const luminance = mean("luminance");
  const variance = kept.reduce((sum, item) => sum + (item.luminance - luminance) ** 2, 0) / kept.length;
  return {
    luminance,
    contrast: clamp(Math.sqrt(variance) * 3, 0, 1),
    saturation: mean("saturation"),
    temperature: clamp(mean("temperature"), -100, 100),
    tint: clamp(mean("tint"), -100, 100),
    sharpness: clamp(0.25 + Math.sqrt(variance) * 1.8, 0, 1),
    validPixelRatio: samples.length / Math.max(1, Math.ceil((x1 - x0) / step) * Math.ceil((y1 - y0) / step)),
  };
}

export function analyzeRoomLighting(
  source: PixelSource,
  existing?: RoomLightProfile,
): RoomLightProfile {
  const sample = sampleLighting(source);
  const now = new Date().toISOString();
  const contrast = sample.contrast * 100;
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: existing?.name ?? "Iluminación analizada",
    mode: "auto",
    direction: estimateLightDirection(source),
    elevation: clamp(72 - contrast * 0.35, 30, 78),
    intensity: clamp(sample.luminance * 100, 15, 90),
    temperature: Math.round(sample.temperature),
    ambientBrightness: Math.round((sample.luminance - 0.5) * 100),
    ambientContrast: Math.round((sample.contrast - 0.3) * 100),
    shadowStrength: Math.round(clamp(contrast * 0.8, 15, 75)),
    shadowSoftness: Math.round(clamp(90 - contrast, 25, 90)),
    sourceType: "unknown",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
