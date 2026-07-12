import { clamp01 } from "@/lib/paint/colorMath";

export function extractIlluminationPass(
  localLuminance: number,
  averageLuminance: number,
) {
  return Math.min(1.8, Math.max(0.25, localLuminance / Math.max(0.04, averageLuminance)));
}

export function recombineShadowPass(
  baseLuminance: number,
  illumination: number,
) {
  return clamp01(baseLuminance * illumination);
}
