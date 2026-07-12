import type {
  BlendMode,
  PaintMode,
  RenderQuality,
  WallMask,
} from "@/types/editor";
import { DEFAULT_WHITE_BASE_SETTINGS } from "@/lib/paint/whiteBaseOptimizer";

export type ResolvedPaintSettings = {
  blendMode: BlendMode;
  edgeFeather: number;
  paintIntensity: number;
  paintMode: PaintMode;
  primerCoverage: number;
  renderQuality: RenderQuality;
};

export const DEFAULT_PAINT_SETTINGS: ResolvedPaintSettings = {
  blendMode: "paint-simulation",
  edgeFeather: 4,
  paintIntensity: 100,
  paintMode: "white-base",
  primerCoverage: 100,
  renderQuality: "high",
};

export const PAINT_QUALITY_SCALE: Record<RenderQuality, number> = {
  draft: 0.4,
  high: 0.7,
  ultra: 1,
};

export function clampPaintSetting(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function resolvePaintSettings(
  mask: WallMask,
  globalBlendMode: BlendMode,
): ResolvedPaintSettings {
  return {
    blendMode: mask.blendMode ?? globalBlendMode,
    edgeFeather: clampPaintSetting(
      mask.edgeFeather ?? DEFAULT_PAINT_SETTINGS.edgeFeather,
      0,
      40,
    ),
    paintIntensity: clampPaintSetting(
      mask.paintIntensity ?? DEFAULT_PAINT_SETTINGS.paintIntensity,
      0,
      200,
    ),
    paintMode: mask.paintMode ?? DEFAULT_PAINT_SETTINGS.paintMode,
    primerCoverage: clampPaintSetting(
      mask.primerCoverage ?? DEFAULT_PAINT_SETTINGS.primerCoverage,
      0,
      100,
    ),
    renderQuality: mask.renderQuality ?? DEFAULT_PAINT_SETTINGS.renderQuality,
  };
}

export function withDefaultPaintSettings(mask: WallMask): WallMask {
  return {
    ...mask,
    blendMode: mask.blendMode ?? DEFAULT_PAINT_SETTINGS.blendMode,
    edgeFeather: mask.edgeFeather ?? DEFAULT_PAINT_SETTINGS.edgeFeather,
    paintIntensity:
      mask.paintIntensity ?? DEFAULT_PAINT_SETTINGS.paintIntensity,
    paintMode: mask.paintMode ?? DEFAULT_PAINT_SETTINGS.paintMode,
    primerCoverage:
      mask.primerCoverage ?? DEFAULT_PAINT_SETTINGS.primerCoverage,
    renderQuality: mask.renderQuality ?? DEFAULT_PAINT_SETTINGS.renderQuality,
    whiteBaseSettings: {
      ...DEFAULT_WHITE_BASE_SETTINGS,
      ...mask.whiteBaseSettings,
    },
  };
}
