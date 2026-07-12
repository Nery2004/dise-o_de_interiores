import "server-only";
import type { WallAIProviderName } from "@/lib/wallDetection/types";
import type { SegmentationProviderInput, SegmentationProviderOutput } from "@/lib/wallDetection/pipeline/types";

export type WallSegmentationProvider = {
  name: WallAIProviderName;
  version: string;
  segmentWalls(input: SegmentationProviderInput): Promise<SegmentationProviderOutput>;
};
