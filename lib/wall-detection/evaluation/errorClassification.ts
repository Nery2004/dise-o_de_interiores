import type { BinaryMaskMetrics } from "@/lib/wall-detection/evaluation/metrics";
import type { BoundaryMetrics } from "@/lib/wall-detection/evaluation/boundaryMetrics";
import type { ExclusionLeakageMetric } from "@/lib/wall-detection/evaluation/exclusionMetrics";
import type { FragmentationMetrics } from "@/lib/wall-detection/evaluation/fragmentationMetrics";
import type { PolygonComplexityMetrics } from "@/lib/wall-detection/evaluation/polygonComplexity";
import type { WallMatchingResult } from "@/lib/wall-detection/evaluation/matching";

export type WallDetectionErrorCategory =
  | "over-segmentation"
  | "under-segmentation"
  | "ceiling-leakage"
  | "floor-leakage"
  | "object-leakage"
  | "fragmented-mask"
  | "missing-wall"
  | "duplicate-wall"
  | "boundary-drift"
  | "excessive-complexity"
  | "over-simplification";

export function classifyWallDetectionErrors({
  binary,
  boundary,
  exclusions,
  fragmentation,
  polygon,
  matching,
}: {
  binary: BinaryMaskMetrics;
  boundary: BoundaryMetrics;
  exclusions: ExclusionLeakageMetric[];
  fragmentation: FragmentationMetrics;
  polygon: PolygonComplexityMetrics;
  matching: WallMatchingResult;
}): WallDetectionErrorCategory[] {
  const errors = new Set<WallDetectionErrorCategory>();
  if (binary.precision < 0.8 && binary.recall >= 0.8) errors.add("over-segmentation");
  if (binary.recall < 0.8 && binary.precision >= 0.8) errors.add("under-segmentation");
  if (matching.missedExpectedIndexes.length) errors.add("missing-wall");
  if (matching.duplicatePredictionIndexes.length) errors.add("duplicate-wall");
  if (fragmentation.connectedComponents > 1 || fragmentation.fragmentationScore > 20) errors.add("fragmented-mask");
  if (boundary.boundaryIntersectionOverUnion < 0.65 || boundary.meanBoundaryDistance > 3) errors.add("boundary-drift");
  if (polygon.polygonComplexityScore > 45) errors.add("excessive-complexity");
  if (polygon.pointCount <= 3 && boundary.boundaryIntersectionOverUnion < 0.7) errors.add("over-simplification");
  for (const leakage of exclusions) {
    if (leakage.overlapRatio <= 0.05) continue;
    if (leakage.type === "ceiling") errors.add("ceiling-leakage");
    else if (leakage.type === "floor") errors.add("floor-leakage");
    else errors.add("object-leakage");
  }
  return [...errors].sort();
}
