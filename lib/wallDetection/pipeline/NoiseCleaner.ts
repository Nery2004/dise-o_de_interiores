import { findComponents, maskFromComponents, morphMask } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

function componentGap(first: ReturnType<typeof findComponents>[number], second: ReturnType<typeof findComponents>[number]) {
  const dx = Math.max(0, first.bounds.minX - second.bounds.maxX, second.bounds.minX - first.bounds.maxX);
  const dy = Math.max(0, first.bounds.minY - second.bounds.maxY, second.bounds.minY - first.bounds.maxY);
  return Math.hypot(dx, dy);
}

export class NoiseCleaner {
  clean(mask: BinaryMask, thresholdRatio: number): BinaryMask {
    const minimumArea = Math.max(4, Math.round(mask.data.length * thresholdRatio));
    const components = findComponents(mask).filter((component) => component.pixels.length >= minimumArea);
    if (!components.length) return { ...mask, data: new Uint8Array(mask.data.length) };
    const dominant = components[0];
    const proximity = Math.max(mask.width, mask.height) * 0.035;
    const kept = components.filter((component, index) => index === 0 || (
      component.pixels.length >= dominant.pixels.length * 0.22 && componentGap(component, dominant) <= proximity
    ));
    const primary = maskFromComponents(mask, kept);
    const radius = Math.max(mask.width, mask.height) >= 300 ? 1 : 0;
    return radius ? morphMask(morphMask(primary, radius, "erode"), radius, "dilate") : primary;
  }
}
