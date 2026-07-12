import { morphMask } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

export class GapFiller {
  fill(mask: BinaryMask): BinaryMask {
    const radius = Math.max(1, Math.min(3, Math.round(Math.max(mask.width, mask.height) * 0.003)));
    return morphMask(morphMask(mask, radius, "dilate"), radius, "erode");
  }
}
