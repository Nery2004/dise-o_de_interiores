import { clamp01, type OklabColor } from "@/lib/paint/colorMath";

export function applyWhiteBasePass(
  source: OklabColor,
  primerCoverage: number,
): OklabColor {
  const coverage = clamp01(primerCoverage / 100);
  return {
    l: source.l + (1 - source.l) * coverage * 0.08,
    a: source.a * (1 - coverage),
    b: source.b * (1 - coverage),
  };
}
