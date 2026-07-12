import { cloneMask, isBoundaryPixel } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask, EdgeMap } from "@/lib/wallDetection/pipeline/types";
import { AdaptiveFeather } from "@/lib/wallDetection/pipeline/AdaptiveFeather";

export class WallBoundaryOptimizer {
  private feather = new AdaptiveFeather();

  optimize(mask: BinaryMask, edgeMap: EdgeMap | null, featherStrength: number): BinaryMask {
    let current = cloneMask(mask);
    const iterations = Math.max(1, Math.min(3, Math.round(featherStrength * 3)));
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const next = cloneMask(current);
      for (let y = 1; y < mask.height - 1; y += 1) for (let x = 1; x < mask.width - 1; x += 1) {
        if (!isBoundaryPixel(current, x, y)) continue;
        const index = y * mask.width + x;
        const localStrength = this.feather.strength(edgeMap, index, featherStrength);
        if (localStrength < 0.12) continue;
        let filled = 0;
        for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) {
          if (ox || oy) filled += current.data[(y + oy) * mask.width + x + ox] ? 1 : 0;
        }
        if (filled >= 6 && localStrength >= 0.2) next.data[index] = 1;
        else if (filled <= 2 && localStrength >= 0.2) next.data[index] = 0;
      }
      current = next;
    }
    return current;
  }
}
