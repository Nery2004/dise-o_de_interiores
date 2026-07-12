import type { EdgeMap } from "@/lib/wallDetection/pipeline/types";

export class AdaptiveFeather {
  strength(edgeMap: EdgeMap | null, index: number, configuredStrength: number) {
    if (!edgeMap) return configuredStrength;
    const edgeRatio = Math.min(1, edgeMap.magnitude[index] / Math.max(1, edgeMap.threshold * 1.5));
    return configuredStrength * (1 - edgeRatio * 0.85);
  }
}
