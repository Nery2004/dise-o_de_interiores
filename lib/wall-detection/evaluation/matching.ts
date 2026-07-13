import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";
import { calculateBinaryMaskMetrics } from "@/lib/wall-detection/evaluation/metrics";

export type WallMatch = {
  predictedIndex: number;
  expectedIndex: number;
  intersectionOverUnion: number;
};

export type WallMatchingResult = {
  matches: WallMatch[];
  extraPredictionIndexes: number[];
  missedExpectedIndexes: number[];
  matchedWallMeanIou: number;
  wallCountAccuracy: number;
  duplicatePredictionIndexes: number[];
};

/** Maximizes total IoU with deterministic dynamic programming; fixtures are capped at 15 walls. */
export function matchPredictedWallsToExpectedWalls(
  predicted: BinaryMask[],
  expected: BinaryMask[],
  minimumMatchIou = 0.05,
): WallMatchingResult {
  if (predicted.length > 15 || expected.length > 15)
    throw new Error("El matching de evaluación admite hasta 15 paredes por caso.");
  const ious = predicted.map((prediction) =>
    expected.map((truth) => calculateBinaryMaskMetrics(prediction, truth).intersectionOverUnion),
  );
  const memo = new Map<string, { score: number; matches: WallMatch[] }>();
  const solve = (predictedIndex: number, usedExpected: number): { score: number; matches: WallMatch[] } => {
    if (predictedIndex >= predicted.length) return { score: 0, matches: [] };
    const key = `${predictedIndex}:${usedExpected}`;
    const cached = memo.get(key);
    if (cached) return cached;
    let best = solve(predictedIndex + 1, usedExpected);
    for (let expectedIndex = 0; expectedIndex < expected.length; expectedIndex += 1) {
      if (usedExpected & (1 << expectedIndex)) continue;
      const iou = ious[predictedIndex][expectedIndex];
      if (iou < minimumMatchIou) continue;
      const next = solve(predictedIndex + 1, usedExpected | (1 << expectedIndex));
      const candidate = {
        score: iou + next.score,
        matches: [{ predictedIndex, expectedIndex, intersectionOverUnion: iou }, ...next.matches],
      };
      if (
        candidate.score > best.score + 1e-12 ||
        (Math.abs(candidate.score - best.score) <= 1e-12 && candidate.matches.length > best.matches.length)
      )
        best = candidate;
    }
    memo.set(key, best);
    return best;
  };
  const result = solve(0, 0);
  const matchedPredictions = new Set(result.matches.map((match) => match.predictedIndex));
  const matchedExpected = new Set(result.matches.map((match) => match.expectedIndex));
  const extraPredictionIndexes = predicted.map((_, index) => index).filter((index) => !matchedPredictions.has(index));
  const missedExpectedIndexes = expected.map((_, index) => index).filter((index) => !matchedExpected.has(index));
  const duplicatePredictionIndexes = extraPredictionIndexes.filter((predictionIndex) =>
    ious[predictionIndex]?.some((iou, expectedIndex) => matchedExpected.has(expectedIndex) && iou >= minimumMatchIou),
  );
  return {
    matches: result.matches.sort((first, second) => first.expectedIndex - second.expectedIndex),
    extraPredictionIndexes,
    missedExpectedIndexes,
    matchedWallMeanIou: result.matches.length
      ? result.matches.reduce((sum, match) => sum + match.intersectionOverUnion, 0) / result.matches.length
      : expected.length || predicted.length ? 0 : 1,
    wallCountAccuracy: Math.max(predicted.length, expected.length)
      ? 1 - Math.abs(predicted.length - expected.length) / Math.max(predicted.length, expected.length)
      : 1,
    duplicatePredictionIndexes,
  };
}
