import type { DecorObjectCategory } from "@/types/decor-object";
import type { RoomLightProfile } from "@/types/lighting";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export const LIGHTING_ADJUSTMENT_MIN = -100;
export const LIGHTING_ADJUSTMENT_MAX = 100;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : 0));
}

export function normalizeDirection(direction: { x: number; y: number }) {
  const x = Number.isFinite(direction.x) ? direction.x : 0;
  const y = Number.isFinite(direction.y) ? direction.y : 1;
  const length = Math.hypot(x, y);
  return length < 0.0001 ? { x: 0, y: 1 } : { x: x / length, y: y / length };
}

export function createDefaultRoomLightProfile(
  name = "Iluminación principal",
): RoomLightProfile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    mode: "manual",
    direction: { x: 0.45, y: 0.89 },
    elevation: 55,
    intensity: 55,
    temperature: 0,
    ambientBrightness: 0,
    ambientContrast: 0,
    shadowStrength: 45,
    shadowSoftness: 65,
    sourceType: "unknown",
    createdAt: now,
    updatedAt: now,
  };
}

type ShadowPreset = NonNullable<PlacedDecorObject["shadowSettings"]>;

export function defaultShadowForCategory(
  category: DecorObjectCategory,
  surfaceType: PlacedDecorObject["surfaceType"],
): ShadowPreset {
  const wall = surfaceType === "wall" || category === "cuadros";
  const presets: Partial<Record<DecorObjectCategory, Partial<ShadowPreset>>> = {
    sillones: { contactWidth: 0.78, contactHeight: 0.11, opacity: 0.26 },
    sillas: { contactWidth: 0.52, contactHeight: 0.08, opacity: 0.2 },
    mesas: { contactWidth: 0.66, contactHeight: 0.09, opacity: 0.22 },
    macetas: { contactWidth: 0.34, contactHeight: 0.08, opacity: 0.3, blur: 8 },
    plantas: { contactWidth: 0.3, contactHeight: 0.07, opacity: 0.22 },
    lamparas: { contactWidth: 0.22, contactHeight: 0.055, scaleY: 0.42 },
    alfombras: { type: "contact", contactWidth: 0.92, contactHeight: 0.025, opacity: 0.08 },
    cuadros: { type: "projected", opacity: 0.16, blur: 6, offsetX: 4, offsetY: 5, scaleY: 1 },
    estanterias: { contactWidth: 0.72, contactHeight: 0.08 },
    camas: { contactWidth: 0.86, contactHeight: 0.12 },
    escritorios: { contactWidth: 0.68, contactHeight: 0.08 },
  };
  return {
    enabled: !wall || category === "cuadros",
    type: wall ? "projected" : "both",
    opacity: 0.22,
    blur: 12,
    softness: 65,
    offsetX: 14,
    offsetY: 10,
    scaleX: 0.92,
    scaleY: 0.34,
    rotation: 0,
    color: "#1f2421",
    contactOpacity: 0.24,
    contactBlur: 8,
    contactWidth: 0.62,
    contactHeight: 0.08,
    autoDirection: true,
    ...presets[category],
  };
}

export function lightingDefaults(
  category: DecorObjectCategory,
  surfaceType: PlacedDecorObject["surfaceType"],
): Pick<
  PlacedDecorObject,
  | "lightingMode"
  | "brightness"
  | "contrast"
  | "saturation"
  | "temperature"
  | "tint"
  | "exposure"
  | "highlights"
  | "shadows"
  | "sharpness"
  | "depthBlur"
  | "adaptDepthBlur"
  | "adaptTexture"
  | "grain"
  | "shadowSettings"
  | "tags"
  | "relativeScale"
> {
  return {
    lightingMode: "auto",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    sharpness: 0,
    depthBlur: 0,
    adaptDepthBlur: true,
    adaptTexture: true,
    grain: 0,
    shadowSettings: defaultShadowForCategory(category, surfaceType),
    tags: [],
    relativeScale: "medium",
  };
}

export function withLightingDefaults(
  object: PlacedDecorObject,
  category: DecorObjectCategory,
): PlacedDecorObject {
  const defaults = lightingDefaults(category, object.surfaceType);
  return {
    ...defaults,
    ...object,
    tags: Array.isArray(object.tags) ? object.tags : [],
    relativeScale: object.relativeScale ?? "medium",
    shadowSettings: {
      ...defaults.shadowSettings!,
      ...(object.shadowSettings ?? {}),
    },
  };
}

export function sanitizeRoomLightProfile(profile: RoomLightProfile): RoomLightProfile {
  return {
    ...profile,
    name: profile.name.trim().slice(0, 80) || "Iluminación",
    mode: profile.mode === "auto" ? "auto" : "manual",
    direction: normalizeDirection(profile.direction),
    elevation: clamp(profile.elevation, 0, 90),
    intensity: clamp(profile.intensity, 0, 100),
    temperature: clamp(profile.temperature, -100, 100),
    ambientBrightness: clamp(profile.ambientBrightness, -100, 100),
    ambientContrast: clamp(profile.ambientContrast, -100, 100),
    shadowStrength: clamp(profile.shadowStrength, 0, 100),
    shadowSoftness: clamp(profile.shadowSoftness, 0, 100),
  };
}
