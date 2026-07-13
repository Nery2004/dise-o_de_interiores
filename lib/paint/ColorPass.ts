import {
  clamp01,
  mixNumber,
  type OklabColor,
} from "@/lib/colors/colorSpace";
import { recombineShadowPass } from "@/lib/paint/ShadowPass";
import { recombineTexturePass } from "@/lib/paint/TexturePass";
import { preserveHighlightLuminance } from "@/lib/paint/HighlightPreservationPass";

export function paintReplacementStrength(intensity: number) {
  const normalized = clamp01(intensity / 100);
  if (intensity <= 100) return 0.96 * normalized ** 0.85;
  return clamp01(0.96 + ((intensity - 100) / 100) * 0.04);
}

export function applyColorPass({
  averageLuminance,
  base,
  illumination,
  intensity,
  originalLuminance,
  primerCoverage,
  shadowPreservation,
  target,
  texture,
  texturePreservation,
}: {
  averageLuminance: number;
  base: OklabColor;
  illumination: number;
  intensity: number;
  originalLuminance: number;
  primerCoverage: number;
  shadowPreservation: number;
  target: OklabColor;
  texture: number;
  texturePreservation: number;
}): OklabColor {
  const replacement = paintReplacementStrength(intensity);
  const primer = clamp01(primerCoverage / 100);
  const chromaReplacement = mixNumber(replacement * 0.78, replacement, primer);
  const overdrive = clamp01((intensity - 100) / 100);
  const paintBaseLuminance = mixNumber(
    averageLuminance,
    target.l,
    0.72 + replacement * 0.2,
  );
  const preservedIllumination = mixNumber(
    1,
    illumination,
    shadowPreservation / 100,
  );
  const litPaint = recombineShadowPass(
    paintBaseLuminance,
    preservedIllumination,
  );
  const detailedPaint = recombineTexturePass(
    litPaint,
    texture,
    (texturePreservation / 100) * 0.95,
  );
  const highlightProtected = preserveHighlightLuminance(
    detailedPaint,
    originalLuminance,
    88,
    averageLuminance,
  );
  const replacedLuminance = mixNumber(base.l, highlightProtected, replacement);
  // A small final high-pass reapplication prevents strong coverage from
  // flattening fine wall relief after illumination recomposition.
  const textureProtectedLuminance = recombineTexturePass(
    replacedLuminance,
    texture,
    (texturePreservation / 100) * 0.16,
  );

  return {
    l: textureProtectedLuminance,
    a: mixNumber(base.a, target.a, chromaReplacement) * (1 + overdrive * 0.12),
    b: mixNumber(base.b, target.b, chromaReplacement) * (1 + overdrive * 0.12),
  };
}
