import { clamp01, mixNumber } from "@/lib/colors/colorSpace";

/** Smoothly preserves bright structure without a hard threshold. */
export function preserveHighlightLuminance(
  paintedLuminance: number,
  originalLuminance: number,
  strength: number,
  averageLuminance = 0.7,
) {
  const normalizedStrength = clamp01(strength / 100);
  // Only protect light that is exceptional for this wall. A uniformly white
  // wall must still accept a darker paint; a window reflection must remain.
  const kneeStart = Math.min(0.96, Math.max(0.78, averageLuminance + 0.12));
  const amount = clamp01(
    (originalLuminance - kneeStart) / Math.max(0.01, 1 - kneeStart),
  );
  const smoothKnee = amount * amount * (3 - 2 * amount);
  return clamp01(mixNumber(paintedLuminance, Math.max(paintedLuminance, originalLuminance), smoothKnee * normalizedStrength));
}
