import { clamp } from "@/lib/lighting/lightProfile";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export type ObjectColorAdjustments = Pick<
  PlacedDecorObject,
  "brightness" | "contrast" | "saturation" | "temperature" | "tint" | "exposure" | "highlights" | "shadows" | "sharpness" | "depthBlur" | "grain"
>;

function seededNoise(index: number) {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value) - 0.5;
}

export function applyObjectColorAdjustments(imageData: ImageData, settings: ObjectColorAdjustments) {
  const data = imageData.data;
  const exposure = 2 ** (clamp(settings.exposure, -100, 100) / 100);
  const brightness = 1 + clamp(settings.brightness, -100, 100) / 100;
  const contrast = 1 + clamp(settings.contrast, -100, 100) / 100;
  const saturation = 1 + clamp(settings.saturation, -100, 100) / 100;
  const warm = clamp(settings.temperature, -100, 100) * 0.34;
  const tint = clamp(settings.tint, -100, 100) * 0.22;
  const highlights = clamp(settings.highlights, -100, 100) / 100;
  const shadows = clamp(settings.shadows, -100, 100) / 100;
  const grain = clamp(settings.grain, 0, 20) * 0.65;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    let r = data[index] * exposure * brightness;
    let g = data[index + 1] * exposure * brightness;
    let b = data[index + 2] * exposure * brightness;
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    r = luminance + (r - luminance) * saturation;
    g = luminance + (g - luminance) * saturation;
    b = luminance + (b - luminance) * saturation;
    r += warm + tint * 0.35;
    g -= tint;
    b -= warm - tint * 0.35;
    const tonal = luminance / 255;
    const toneDelta = (tonal > 0.55 ? highlights * (tonal - 0.55) : shadows * (0.55 - tonal)) * 90;
    const noise = grain ? seededNoise(index) * grain : 0;
    data[index] = clamp((r - 127.5) * contrast + 127.5 + toneDelta + noise, 0, 255);
    data[index + 1] = clamp((g - 127.5) * contrast + 127.5 + toneDelta + noise, 0, 255);
    data[index + 2] = clamp((b - 127.5) * contrast + 127.5 + toneDelta + noise, 0, 255);
  }
  return imageData;
}
