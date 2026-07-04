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
  ): Promise<WallDetectionResult[]>;
};

export type WallDetectionMode = "mock" | "ai";
