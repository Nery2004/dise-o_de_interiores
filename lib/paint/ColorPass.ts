import {
  clamp01,
  mixNumber,
  type OklabColor,
} from "@/lib/paint/colorMath";
import { recombineShadowPass } from "@/lib/paint/ShadowPass";
import { recombineTexturePass } from "@/lib/paint/TexturePass";

export function paintReplacementStrength(intensity: number) {
  if (intensity <= 100) return clamp01((intensity / 100) * 0.82);
  return clamp01(0.82 + ((intensity - 100) / 100) * 0.18);
}

export function applyColorPass({
  averageLuminance,
  base,
  illumination,
  intensity,
  target,
  texture,
}: {
  averageLuminance: number;
  base: OklabColor;
  illumination: number;
  intensity: number;
  target: OklabColor;
  texture: number;
}): OklabColor {
  const replacement = paintReplacementStrength(intensity);
  const overdrive = clamp01((intensity - 100) / 100);
  const paintBaseLuminance = mixNumber(
    averageLuminance,
    target.l,
    0.72 + replacement * 0.2,
  );
  const litPaint = recombineShadowPass(paintBaseLuminance, illumination);
  const detailedPaint = recombineTexturePass(litPaint, texture);

  return {
    l: mixNumber(base.l, detailedPaint, replacement),
    a: mixNumber(base.a, target.a, replacement) * (1 + overdrive * 0.12),
    b: mixNumber(base.b, target.b, replacement) * (1 + overdrive * 0.12),
  };
}
