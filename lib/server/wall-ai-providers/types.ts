import type { WallSegmentationProvider } from "@/lib/server/wall-detection/WallSegmentationProvider";

export type ServerWallAIProvider = WallSegmentationProvider;
export type { SegmentationProviderInput as ServerWallAIProviderInput } from "@/lib/wallDetection/pipeline/types";

export class WallAIProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WallAIProviderConfigurationError";
  }
}
