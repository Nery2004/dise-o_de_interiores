import { clamp } from "@/lib/lighting/lightProfile";
import type { RoomLightProfile, RoomLightingSample } from "@/types/lighting";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function matchObjectBrightnessToRoom(sample: RoomLightingSample, assetLuminance = 0.55) {
  return Math.round(clamp((sample.luminance - assetLuminance) * 90, -28, 24));
}

export function calculateDepthBlur(depth: number, roomSharpness = 0.5) {
  return Math.round(clamp((1 - depth) * (1 - roomSharpness) * 3.5, 0, 3) * 10) / 10;
}

export function getAutomaticObjectLighting(
  object: PlacedDecorObject,
  sample: RoomLightingSample,
  profile?: RoomLightProfile,
): Partial<PlacedDecorObject> {
  const roomTemperature = profile ? (profile.temperature * 0.65 + sample.temperature * 0.35) : sample.temperature;
  const shadow = object.shadowSettings;
  const strength = (profile?.shadowStrength ?? 45) / 100;
  const softness = (profile?.shadowSoftness ?? 65) / 100;
  return {
    lightingMode: "auto",
    brightness: matchObjectBrightnessToRoom(sample),
    contrast: Math.round(clamp((sample.contrast - 0.35) * 45, -18, 15)),
    saturation: Math.round(clamp((sample.saturation - 0.38) * 35, -16, 12)),
    temperature: Math.round(clamp(roomTemperature * 0.42, -28, 28)),
    tint: Math.round(clamp(sample.tint * 0.28, -18, 18)),
    exposure: Math.round(clamp((sample.luminance - 0.5) * 24, -12, 10)),
    highlights: Math.round(clamp((sample.contrast - 0.4) * 25, -10, 10)),
    shadows: Math.round(clamp((0.45 - sample.luminance) * 20, -8, 8)),
    sharpness: Math.round(clamp((sample.sharpness - 0.55) * 35, -20, 10)),
    depthBlur: object.adaptDepthBlur ? calculateDepthBlur(object.depth, sample.sharpness) : object.depthBlur,
    grain: object.adaptTexture ? Math.round(clamp((1 - sample.sharpness) * 8, 0, 6)) : object.grain,
    lightProfileId: profile?.id,
    shadowSettings: shadow
      ? {
          ...shadow,
          opacity: clamp(strength * 0.48, 0.06, 0.42),
          blur: clamp(5 + softness * 18, 4, 24),
          contactOpacity: clamp(strength * 0.42, 0.08, 0.36),
          contactBlur: clamp(3 + softness * 10, 3, 14),
        }
      : shadow,
  };
}
