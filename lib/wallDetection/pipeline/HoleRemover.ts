import { applyExclusions, cloneMask, findComponents } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

export class HoleRemover {
  remove(mask: BinaryMask, maximumHoleRatio: number, exclusions: BinaryMask[] = []): BinaryMask {
    const output = cloneMask(mask);
    const maximumArea = Math.max(4, Math.round(mask.data.length * maximumHoleRatio));
    const holes = findComponents(mask, 0);
    for (const hole of holes) {
      const touchesExterior = hole.bounds.minX === 0 || hole.bounds.minY === 0 || hole.bounds.maxX === mask.width - 1 || hole.bounds.maxY === mask.height - 1;
      if (touchesExterior || hole.pixels.length > maximumArea) continue;
      const overlapsExclusion = exclusions.some((exclusion) => exclusion.width === mask.width && exclusion.height === mask.height && hole.pixels.some((index) => exclusion.data[index]));
      if (!overlapsExclusion) for (const index of hole.pixels) output.data[index] = 1;
    }
    return applyExclusions(output, exclusions);
  }
}
