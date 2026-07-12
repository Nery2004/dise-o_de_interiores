import type { ImagePoint } from "@/types/editor";

export type RoomLightSourceType =
  | "window"
  | "ceiling-light"
  | "lamp"
  | "mixed"
  | "unknown";

export type RoomLightProfile = {
  id: string;
  name: string;
  mode: "auto" | "manual";
  /** Direction in which cast shadows travel, normalized to length 1. */
  direction: ImagePoint;
  elevation: number;
  intensity: number;
  temperature: number;
  ambientBrightness: number;
  ambientContrast: number;
  shadowStrength: number;
  shadowSoftness: number;
  sourceType: RoomLightSourceType;
  createdAt: string;
  updatedAt: string;
};

export type RoomLightingSample = {
  luminance: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  sharpness: number;
  validPixelRatio: number;
};

export type ContactShadowGeometry = {
  center: ImagePoint;
  width: number;
  height: number;
  rotation: number;
  blur: number;
  opacity: number;
  color: string;
};

export type ProjectedShadowGeometry = ContactShadowGeometry & {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
};
