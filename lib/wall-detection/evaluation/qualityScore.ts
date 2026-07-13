import type { WallQualityScoreConfig } from "@/lib/wall-detection/evaluation/config";
import { DEFAULT_WALL_DETECTION_EVALUATION_CONFIG } from "@/lib/wall-detection/evaluation/config";

export type WallQualityScoreInput = {
  iou: number;
  dice: number;
  boundaryIou: number;
  precision: number;
  recall: number;
  fragmentationScore: number;
  polygonComplexityScore: number;
};

export function calculateWallQualityScore(
  input: WallQualityScoreInput,
  weights: WallQualityScoreConfig = DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.qualityWeights,
) {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(totalWeight - 1) > 0.000001)
    throw new Error("Los pesos de WallQualityScoreConfig deben sumar 1.");
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const score = 100 * (
    clamp(input.iou) * weights.iou +
    clamp(input.dice) * weights.dice +
    clamp(input.boundaryIou) * weights.boundaryIou +
    clamp(input.precision) * weights.precision +
    clamp(input.recall) * weights.recall +
    (1 - clamp(input.fragmentationScore / 100)) * weights.fragmentation +
    (1 - clamp(input.polygonComplexityScore / 100)) * weights.polygonSimplicity
  );
  return Math.round(Math.max(0, Math.min(100, score)) * 1_000_000) / 1_000_000;
}
