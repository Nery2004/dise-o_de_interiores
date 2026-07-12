import { countMaskPixels, findComponents, isBoundaryPixel } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask, EdgeMap, MaskQualityBreakdown, MaskValidationIssue } from "@/lib/wallDetection/pipeline/types";
import type { WallDetectionPoint } from "@/lib/wallDetection/types";

export class MaskQualityAnalyzer {
  analyze(mask: BinaryMask, polygon: WallDetectionPoint[], providerConfidence: number, edgeMap: EdgeMap | null = null, issues: MaskValidationIssue[] = []) {
    const area = countMaskPixels(mask);
    const components = findComponents(mask);
    let perimeter = 0; let sparse = 0; let edgeMatches = 0;
    for (let y = 0; y < mask.height; y += 1) for (let x = 0; x < mask.width; x += 1) {
      if (!mask.data[y * mask.width + x]) continue;
      let neighbors = 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx >= 0 && ny >= 0 && nx < mask.width && ny < mask.height && mask.data[ny * mask.width + nx]) neighbors += 1;
      }
      if (neighbors <= 1) sparse += 1;
      if (isBoundaryPixel(mask, x, y)) {
        perimeter += 1;
        if (edgeMap && edgeMap.magnitude[y * mask.width + x] >= edgeMap.threshold) edgeMatches += 1;
      }
    }
    const holes = findComponents(mask, 0).filter((component) => component.bounds.minX > 0 && component.bounds.minY > 0 && component.bounds.maxX < mask.width - 1 && component.bounds.maxY < mask.height - 1);
    let straightSegments = 0;
    polygon.forEach((point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      const angle = Math.abs(Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI) % 90;
      if (angle < 8 || angle > 82) straightSegments += 1;
    });
    const compactness = perimeter ? Math.min(1, 4 * Math.PI * area / (perimeter * perimeter) * 2.5) : 0;
    const breakdown: MaskQualityBreakdown = {
      continuity: components.length ? Math.max(0, 1 - (components.length - 1) * 0.18) : 0,
      noise: area ? Math.max(0, 1 - sparse / area * 20) : 0,
      holes: Math.max(0, 1 - holes.reduce((sum, hole) => sum + hole.pixels.length, 0) / Math.max(1, area) * 4),
      straightEdges: polygon.length ? Math.max(0.35, straightSegments / polygon.length) : 0,
      areaPerimeter: compactness,
      edgeMatch: edgeMap && perimeter ? Math.min(1, edgeMatches / perimeter * 3) : 0.65,
      providerConfidence: Math.max(0, Math.min(1, providerConfidence)),
    };
    const penalty = issues.reduce((sum, item) => sum + (item.severity === "high" ? 8 : item.severity === "medium" ? 4 : 1.5) * item.confidence, 0);
    const score = (breakdown.providerConfidence * 0.25 + breakdown.continuity * 0.16 + breakdown.noise * 0.12 + breakdown.holes * 0.1 + breakdown.straightEdges * 0.1 + breakdown.areaPerimeter * 0.1 + breakdown.edgeMatch * 0.17) * 100 - penalty;
    return { score: Math.round(Math.max(0, Math.min(100, score)) * 10) / 10, breakdown };
  }
}
