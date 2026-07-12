import type { WallDetectionPoint, WallDetectionResult } from "@/lib/wallDetection/types";
import type { RefinementSettingsInput } from "@/lib/wallDetection/pipeline/RefinementSettings";

export type BinaryMask = { width: number; height: number; data: Uint8Array };

export type EdgeMap = {
  width: number;
  height: number;
  magnitude: Uint8Array;
  luminance: Uint8Array;
  threshold: number;
};

export type ArchitectureLine = {
  a: number;
  b: number;
  c: number;
  angle: number;
  support: number;
  kind: "horizontal" | "vertical" | "converging";
};

export type RefinementStageName =
  | "edgeAlignment"
  | "perspectiveCorrection"
  | "gapFilling"
  | "holeRemoval"
  | "noiseRemoval"
  | "boundaryOptimization"
  | "cornerSnap"
  | "polygonOptimization";

export type MaskErrorType =
  | "ceiling-invasion"
  | "floor-invasion"
  | "window-invasion"
  | "curtain-invasion"
  | "sofa-invasion"
  | "picture-invasion"
  | "too-small"
  | "too-large"
  | "fragmented";

export type MaskValidationIssue = {
  type: MaskErrorType;
  severity: "low" | "medium" | "high";
  confidence: number;
};

export type MaskQualityBreakdown = {
  continuity: number;
  noise: number;
  holes: number;
  straightEdges: number;
  areaPerimeter: number;
  edgeMatch: number;
  providerConfidence: number;
};

export type RefinementTrace = {
  original: BinaryMask;
  cleaned: BinaryMask;
  corrected: BinaryMask;
  final: BinaryMask;
};

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
  refinement: RefinementSettingsInput;
};

export type PipelineDebugRegion = {
  id: string;
  mask: BinaryMask;
  contour: WallDetectionPoint[];
  polygon: WallDetectionPoint[];
  refined: WallDetectionPoint[];
  confidence: number;
  qualityScore: number;
  qualityBreakdown: MaskQualityBreakdown;
  issues: MaskValidationIssue[];
  trace: RefinementTrace;
  stageTimings: Partial<Record<RefinementStageName, number>>;
  appliedStages: RefinementStageName[];
  retryCount: number;
};

export type SegmentationPipelineResult = {
  walls: WallDetectionResult[];
  providerVersion: string;
  processingTimeMs: number;
  averageQualityScore: number;
  debugRegions?: PipelineDebugRegion[];
};
