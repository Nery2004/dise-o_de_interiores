import { applyBlendPass } from "@/lib/paint/BlendPass";
import {
  applyColorPass,
  paintReplacementStrength,
} from "@/lib/paint/ColorPass";
import {
  clamp01,
  mixNumber,
  mixRgb,
  rgbToOklab,
  type OklabColor,
  type RgbColor,
} from "@/lib/colors/colorSpace";
import { mapOklabToSrgb } from "@/lib/colors/colorManagement";
import type { ResolvedPaintSettings } from "@/lib/paint/paintSettings";
import { extractIlluminationPass } from "@/lib/paint/ShadowPass";
import {
  extractTexturePass,
  recombineTexturePass,
} from "@/lib/paint/TexturePass";
import { renderAdaptiveWhiteBase } from "@/lib/paint/whiteBaseRenderer";
import type { EffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";

export type PaintPixelInput = {
  averageLuminance: number;
  localLuminance: number;
  settings: ResolvedPaintSettings;
  source: RgbColor;
  target: RgbColor;
  targetLab?: OklabColor;
  whiteBaseSettings: EffectiveWhiteBaseSettings;
  whiteBasePreviewOnly?: boolean;
};

export function processPaintPixel({
  averageLuminance,
  localLuminance,
  settings,
  source,
  target,
  targetLab: suppliedTargetLab,
  whiteBaseSettings,
  whiteBasePreviewOnly = false,
}: PaintPixelInput): RgbColor {
  const sourceLab = rgbToOklab(source);
  const targetLab = suppliedTargetLab ?? rgbToOklab(target);
  const baseLab =
    settings.paintMode === "white-base"
      ? renderAdaptiveWhiteBase({
          averageLuminance,
          localLuminance,
          settings: whiteBaseSettings,
          source: sourceLab,
        })
      : sourceLab;
  const baseRgb = mapOklabToSrgb(baseLab);
  if (whiteBasePreviewOnly) return baseRgb;
  const texture = extractTexturePass(sourceLab.l, localLuminance);
  const illumination = extractIlluminationPass(
    localLuminance,
    averageLuminance,
  );

  if (settings.blendMode === "paint-simulation") {
    return mapOklabToSrgb(
      applyColorPass({
        averageLuminance,
        base: baseLab,
        illumination,
        intensity: settings.paintIntensity,
        originalLuminance: sourceLab.l,
        primerCoverage: whiteBaseSettings.primerCoverage,
        shadowPreservation: whiteBaseSettings.shadowPreservation,
        target: targetLab,
        texture,
        texturePreservation: whiteBaseSettings.texturePreservation,
      }),
    );
  }

  const replacement = paintReplacementStrength(settings.paintIntensity);
  const overdrive = clamp01((settings.paintIntensity - 100) / 100);
  const blended = applyBlendPass(settings.blendMode, baseRgb, target);
  const mixed = mixRgb(baseRgb, blended, replacement);
  const mixedLab = rgbToOklab(mixed);
  const preservedLuminance = recombineTexturePass(
    mixNumber(mixedLab.l, sourceLab.l, 0.72),
    texture,
    (whiteBaseSettings.texturePreservation / 100) * 0.85,
  );

  return mapOklabToSrgb({
    l: preservedLuminance,
    a: mixedLab.a * (1 + overdrive * 0.1),
    b: mixedLab.b * (1 + overdrive * 0.1),
  });
}
