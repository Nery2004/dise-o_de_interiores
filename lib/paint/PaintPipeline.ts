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
} from "@/lib/paint/colorMath";
import type { ResolvedPaintSettings } from "@/lib/paint/paintSettings";
import { extractIlluminationPass } from "@/lib/paint/ShadowPass";
import {
  extractTexturePass,
  recombineTexturePass,
} from "@/lib/paint/TexturePass";
import { applyWhiteBasePass } from "@/lib/paint/WhiteBasePass";

export type PaintPixelInput = {
  averageLuminance: number;
  localLuminance: number;
  settings: ResolvedPaintSettings;
  source: RgbColor;
  target: RgbColor;
};

export function processPaintPixel({
  averageLuminance,
  localLuminance,
  settings,
  source,
  target,
}: PaintPixelInput): RgbColor {
  const sourceLab = rgbToOklab(source);
  const targetLab = rgbToOklab(target);
  const baseLab =
    settings.paintMode === "white-base"
      ? applyWhiteBasePass(sourceLab, settings.primerCoverage)
      : sourceLab;
  const baseRgb = oklabToRgb(baseLab);
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
        target: targetLab,
        texture,
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
    0.75,
  );

  return oklabToRgb({
    l: preservedLuminance,
    a: mixedLab.a * (1 + overdrive * 0.1),
    b: mixedLab.b * (1 + overdrive * 0.1),
  });
}
