export type WallDetectionPoint = {
  x: number;
  y: number;
};

export type WallDetectionResult = {
  id: string;
  name: string;
  confidence?: number;
  qualityScore?: number;
  points: WallDetectionPoint[];
  exclusionPolygons?: WallDetectionPoint[][];
  refinement?: WallRefinementSummary;
};

export type WallMaskIssue = {
  type: "ceiling-invasion" | "floor-invasion" | "window-invasion" | "curtain-invasion" | "sofa-invasion" | "picture-invasion" | "too-small" | "too-large" | "fragmented";
  severity: "low" | "medium" | "high";
  confidence: number;
};

export type WallRefinementSummary = {
  appliedStages: string[];
  refinementCount: number;
  pointCount: number;
  retryCount: number;
  issues: WallMaskIssue[];
  stageTimings: Partial<Record<string, number>>;
};

export type WallDetectionMetrics = {
  providerVersion: string;
  processingTimeMs: number;
  wallCount: number;
  averageQualityScore: number;
  cacheHit: boolean;
  refinementCount: number;
};

export type WallDetectionDebugRegion = {
  id: string;
  width: number;
  height: number;
  binaryMaskRle: number[];
  contour: WallDetectionPoint[];
  polygon: WallDetectionPoint[];
  refined: WallDetectionPoint[];
  confidence: number;
  qualityScore: number;
  qualityBreakdown: Record<string, number>;
  issues: WallMaskIssue[];
  stageTimings: Partial<Record<string, number>>;
  appliedStages: string[];
  retryCount: number;
  stageMasksRle: {
    original: number[];
    cleaned: number[];
    corrected: number[];
    final: number[];
  };
};

export type WallDetectionDebug = { regions: WallDetectionDebugRegion[] };

export type WallDetectionOptions = {
  signal?: AbortSignal;
  provider?: WallDetectionMode;
  maskSmoothness?: number;
  polygonTolerance?: number;
  refinement?: Partial<{
    edgeTolerance: number;
    cornerSnapDistance: number;
    noiseThreshold: number;
    holeThreshold: number;
    polygonTolerance: number;
    featherStrength: number;
    qualityThreshold: number;
  }>;
  debug?: boolean;
};

export type WallDetectionProvider = {
  detectWalls(
    imageFile: File,
    imageDimensions: { width: number; height: number },
    options?: WallDetectionOptions,
  ): Promise<WallDetectionResponse>;
};

export type WallDetectionMode =
  | "mock"
  | "ai"
  | "sam2"
  | "florence-2"
  | "grounding-dino"
  | "roboflow"
  | "yolo-segmentation"
  | "custom";

export type WallAIProviderName =
  | "mock"
  | "replicate"
  | "huggingface"
  | "roboflow"
  | "sam2"
  | "florence-2"
  | "grounding-dino"
  | "yolo-segmentation"
  | "custom";

export type WallDetectionApiResponse = {
  walls: WallDetectionResult[];
  provider: WallAIProviderName;
  metrics?: WallDetectionMetrics;
  debug?: WallDetectionDebug;
};

export type WallDetectionResponse = WallDetectionApiResponse;
