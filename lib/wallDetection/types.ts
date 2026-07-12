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
};

export type WallDetectionMetrics = {
  providerVersion: string;
  processingTimeMs: number;
  wallCount: number;
  averageQualityScore: number;
  cacheHit: boolean;
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
};

export type WallDetectionDebug = { regions: WallDetectionDebugRegion[] };

export type WallDetectionOptions = {
  signal?: AbortSignal;
  provider?: WallDetectionMode;
  maskSmoothness?: number;
  polygonTolerance?: number;
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
