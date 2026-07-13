import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";
import { assertCompatibleMasks } from "@/lib/wall-detection/evaluation/metrics";

export type ExclusionRegionType =
  | "ceiling"
  | "floor"
  | "window"
  | "door"
  | "curtain"
  | "sofa"
  | "picture"
  | "television"
  | "furniture";

export type ExclusionLeakageMetric = {
  type: ExclusionRegionType;
  exclusionPixels: number;
  incorrectPixels: number;
  overlapRatio: number;
  predictionShare: number;
  exclusionLeakageScore: number;
};

export function calculateExclusionLeakage(
  predicted: BinaryMask,
  exclusion: BinaryMask,
  type: ExclusionRegionType,
): ExclusionLeakageMetric {
  assertCompatibleMasks(predicted, exclusion);
  let exclusionPixels = 0;
  let predictionPixels = 0;
  let incorrectPixels = 0;
  for (let index = 0; index < predicted.data.length; index += 1) {
    if (predicted.data[index]) predictionPixels += 1;
    if (exclusion.data[index]) {
      exclusionPixels += 1;
      if (predicted.data[index]) incorrectPixels += 1;
    }
  }
  const overlapRatio = exclusionPixels ? incorrectPixels / exclusionPixels : 0;
  return {
    type,
    exclusionPixels,
    incorrectPixels,
    overlapRatio,
    predictionShare: predictionPixels ? incorrectPixels / predictionPixels : 0,
    exclusionLeakageScore: Math.min(100, overlapRatio * 100),
  };
}

export function calculateExclusionLeakageByRegion(
  predicted: BinaryMask,
  exclusions: Partial<Record<ExclusionRegionType, BinaryMask>>,
) {
  return Object.entries(exclusions).map(([type, mask]) =>
    calculateExclusionLeakage(predicted, mask!, type as ExclusionRegionType),
  );
}
