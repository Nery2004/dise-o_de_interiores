import type { WallDetectionPoint, WallDetectionResult } from "@/lib/wallDetection/types";

export type BinaryMask = { width: number; height: number; data: Uint8Array };

export type SegmentationRegion = {
  id: string;
  name?: string;
  confidence: number;
  mask: BinaryMask;
  exclusionMasks?: BinaryMask[];
};

export type SegmentationProviderOutput = {
  regions: SegmentationRegion[];
  modelVersion: string;
};

export type SegmentationProviderInput = {
  imageBuffer: Buffer;
  mimeType: string;
  dimensions: { width: number; height: number };
  processingDimensions: { width: number; height: number };
  signal: AbortSignal;
};

export type PipelineConfig = {
  maskSmoothness: number;
  polygonTolerance: number;
  minimumRegionAreaRatio: number;
  debug: boolean;
};

export type PipelineDebugRegion = {
  id: string;
  mask: BinaryMask;
  contour: WallDetectionPoint[];
  polygon: WallDetectionPoint[];
  refined: WallDetectionPoint[];
  confidence: number;
  qualityScore: number;
};

export type SegmentationPipelineResult = {
  walls: WallDetectionResult[];
  providerVersion: string;
  processingTimeMs: number;
  averageQualityScore: number;
  debugRegions?: PipelineDebugRegion[];
};
