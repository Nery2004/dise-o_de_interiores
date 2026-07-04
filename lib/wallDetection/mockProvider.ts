import type {
  WallDetectionProvider,
  WallDetectionResult,
} from "@/lib/wallDetection/types";

function createDetectionId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}`;
}

export const mockWallDetectionProvider: WallDetectionProvider = {
  async detectWalls(_imageFile, imageDimensions) {
    const { height, width } = imageDimensions;

    const walls: WallDetectionResult[] = [
      {
        id: createDetectionId("mock-left-wall"),
        name: "Pared izquierda",
        confidence: 0.91,
        points: [
          { x: width * 0.03, y: height * 0.17 },
          { x: width * 0.35, y: height * 0.08 },
          { x: width * 0.39, y: height * 0.75 },
          { x: width * 0.06, y: height * 0.88 },
        ],
      },
      {
        id: createDetectionId("mock-back-wall"),
        name: "Pared fondo",
        confidence: 0.94,
        points: [
          { x: width * 0.34, y: height * 0.08 },
          { x: width * 0.69, y: height * 0.1 },
          { x: width * 0.68, y: height * 0.72 },
          { x: width * 0.39, y: height * 0.75 },
        ],
      },
      {
        id: createDetectionId("mock-right-wall"),
        name: "Pared derecha",
        confidence: 0.88,
        points: [
          { x: width * 0.69, y: height * 0.1 },
          { x: width * 0.96, y: height * 0.2 },
          { x: width * 0.91, y: height * 0.87 },
          { x: width * 0.68, y: height * 0.72 },
        ],
      },
    ];

    return {
      walls,
      provider: "mock",
    };
  },
};
