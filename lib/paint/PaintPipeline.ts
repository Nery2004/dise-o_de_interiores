import { applyBlendPass } from "@/lib/paint/BlendPass";
import {
  applyColorPass,
  paintReplacementStrength,
} from "@/lib/paint/ColorPass";
import {
  clamp01,
  mixNumber,
  mixRgb,
  oklabToRgb,
  rgbToOklab,
  type RgbColor,
} from "@/lib/colors/colorSpace";
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
  whiteBaseSettings: EffectiveWhiteBaseSettings;
  whiteBasePreviewOnly?: boolean;
};

export function processPaintPixel({
  averageLuminance,
  localLuminance,
  settings,
  source,
  target,
  whiteBaseSettings,
  whiteBasePreviewOnly = false,
}: PaintPixelInput): RgbColor {
  const sourceLab = rgbToOklab(source);
  const targetLab = rgbToOklab(target);
  const baseLab =
    settings.paintMode === "white-base"
      ? renderAdaptiveWhiteBase({
          averageLuminance,
          localLuminance,
          settings: whiteBaseSettings,
          source: sourceLab,
        })
      : sourceLab;
  const baseRgb = oklabToRgb(baseLab);
  if (whiteBasePreviewOnly) return baseRgb;
  const texture = extractTexturePass(sourceLab.l, localLuminance);
  const illumination = extractIlluminationPass(
    localLuminance,
    averageLuminance,
  );

  if (settings.blendMode === "paint-simulation") {
    return oklabToRgb(
      applyColorPass({
        averageLuminance,
        base: baseLab,
        illumination,
        intensity: settings.paintIntensity,
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

  return oklabToRgb({
    l: preservedLuminance,
    a: mixedLab.a * (1 + overdrive * 0.1),
    b: mixedLab.b * (1 + overdrive * 0.1),
  });
}
