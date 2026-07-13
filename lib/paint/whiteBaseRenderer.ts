import {
  clamp01,
  mixNumber,
  type OklabColor,
} from "@/lib/colors/colorSpace";
import { extractIlluminationPass } from "@/lib/paint/ShadowPass";
import {
  extractTexturePass,
  recombineTexturePass,
} from "@/lib/paint/TexturePass";
import type { EffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";

export function primerCoverageStrength(coverage: number) {
  const normalized = clamp01(coverage / 100);
  return normalized * normalized * (3 - 2 * normalized);
}

export function renderAdaptiveWhiteBase({
  averageLuminance,
  localLuminance,
  settings,
  source,
}: {
  averageLuminance: number;
  localLuminance: number;
  settings: EffectiveWhiteBaseSettings;
  source: OklabColor;
}): OklabColor {
  const primer = primerCoverageStrength(settings.primerCoverage);
  const neutralization =
    clamp01(settings.neutralizationStrength / 100) * primer;
  const saturationReduction = clamp01(settings.saturationReduction / 100);
  const chromaRetention = 1 - neutralization * saturationReduction;
  const warmthShift = (settings.warmthCorrection / 100) * 0.035 * neutralization;
  const brightness = clamp01(settings.baseBrightness / 100);
  const contrast = settings.baseContrast / 100;
  const illumination = extractIlluminationPass(
    localLuminance,
    averageLuminance,
  );
  const preservedIllumination = mixNumber(
    1,
    illumination,
    settings.shadowPreservation / 100,
  );
  const neutralBaseline =
    averageLuminance + (1 - averageLuminance) * brightness * primer * 0.28;
  const contrastedIllumination = Math.max(
    0.15,
    1 + (preservedIllumination - 1) * (1 + contrast),
  );
  const litBase = clamp01(neutralBaseline * contrastedIllumination);
  const texture = extractTexturePass(source.l, localLuminance);
  const detailedBase = recombineTexturePass(
    litBase,
    texture,
    (settings.texturePreservation / 100) * 0.95,
  );

  return {
    l: mixNumber(source.l, detailedBase, primer),
    a: source.a * chromaRetention,
    b: source.b * chromaRetention + warmthShift,
  };
}
