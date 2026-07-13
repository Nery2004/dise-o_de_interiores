import { countMaskPixels, findComponents } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

export type FragmentationMetrics = {
  connectedComponents: number;
  mainComponentPixels: number;
  outsideMainComponentRatio: number;
  holeCount: number;
  totalHoleArea: number;
  holeAreaRatio: number;
  fragmentationScore: number;
};

export function calculateFragmentationMetrics(mask: BinaryMask): FragmentationMetrics {
  const area = countMaskPixels(mask);
  const components = findComponents(mask);
  const holes = findComponents(mask, 0).filter((component) =>
    component.bounds.minX > 0 &&
    component.bounds.minY > 0 &&
    component.bounds.maxX < mask.width - 1 &&
    component.bounds.maxY < mask.height - 1,
  );
  const mainComponentPixels = components[0]?.pixels.length ?? 0;
  const outsideMainComponentRatio = area ? (area - mainComponentPixels) / area : 0;
  const totalHoleArea = holes.reduce((sum, hole) => sum + hole.pixels.length, 0);
  const holeAreaRatio = area ? totalHoleArea / area : 0;
  const componentPenalty = Math.min(1, Math.max(0, components.length - 1) / 5);
  const score = (
    outsideMainComponentRatio * 0.5 +
    Math.min(1, holeAreaRatio * 4) * 0.3 +
    componentPenalty * 0.2
  ) * 100;
  return {
    connectedComponents: components.length,
    mainComponentPixels,
    outsideMainComponentRatio,
    holeCount: holes.length,
    totalHoleArea,
    holeAreaRatio,
    fragmentationScore: Math.min(100, score),
  };
}
