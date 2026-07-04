export type WallDetectionPoint = {
  x: number;
  y: number;
};

export type WallDetectionResult = {
  id: string;
  name: string;
  confidence?: number;
  points: WallDetectionPoint[];
};

export type WallDetectionProvider = {
  detectWalls(
    imageFile: File,
    imageDimensions: { width: number; height: number },
  ): Promise<WallDetectionResponse>;
};

export type WallDetectionMode = "mock" | "ai";

export type WallAIProviderName =
  | "mock"
  | "replicate"
  | "huggingface"
  | "roboflow";

export type WallDetectionApiResponse = {
  walls: WallDetectionResult[];
  provider: WallAIProviderName;
};

export type WallDetectionResponse = WallDetectionApiResponse;
