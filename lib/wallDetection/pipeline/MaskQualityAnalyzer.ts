import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";
import type { WallDetectionPoint } from "@/lib/wallDetection/types";

export class MaskQualityAnalyzer {
  analyze(mask: BinaryMask, polygon: WallDetectionPoint[], providerConfidence: number) {
    let area = 0;
    let sparsePixels = 0;
    for (let index = 0; index < mask.data.length; index += 1) {
      if (!mask.data[index]) continue;
      area += 1;
      const x = index % mask.width;
      const y = Math.floor(index / mask.width);
      let neighbors = 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx >= 0 && ny >= 0 && nx < mask.width && ny < mask.height && mask.data[ny * mask.width + nx]) neighbors += 1;
      }
      if (neighbors <= 1) sparsePixels += 1;
    }
    const areaRatio = area / mask.data.length;
    const areaScore = Math.min(1, areaRatio / 0.08);
    const continuityScore = area ? Math.max(0, 1 - sparsePixels / area * 8) : 0;
    const noiseScore = area ? Math.max(0, 1 - sparsePixels / area * 16) : 0;
    const complexityScore = Math.max(0.45, 1 - Math.max(0, polygon.length - 24) / 80);
    return Math.max(0, Math.min(1, providerConfidence * 0.5 + areaScore * 0.16 + continuityScore * 0.14 + noiseScore * 0.1 + complexityScore * 0.1));
  }
}
