import type { WallDetectionResult } from "@/lib/wallDetection/types";
import type { ServerWallAIProvider } from "@/lib/server/wall-ai-providers/types";

function createWallId(name: string) {
  return `${name}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function createMockWallResults({
  height,
  width,
}: {
  width: number;
  height: number;
}): WallDetectionResult[] {
  return [
    {
      id: createWallId("wall-left"),
      name: "Pared izquierda",
      confidence: 0.9,
      points: [
        { x: width * 0.04, y: height * 0.16 },
        { x: width * 0.35, y: height * 0.08 },
        { x: width * 0.39, y: height * 0.76 },
        { x: width * 0.07, y: height * 0.88 },
      ],
    },
    {
      id: createWallId("wall-back"),
      name: "Pared fondo",
      confidence: 0.92,
      points: [
        { x: width * 0.34, y: height * 0.08 },
        { x: width * 0.7, y: height * 0.1 },
        { x: width * 0.68, y: height * 0.73 },
        { x: width * 0.39, y: height * 0.76 },
      ],
    },
    {
      id: createWallId("wall-right"),
      name: "Pared derecha",
      confidence: 0.87,
      points: [
        { x: width * 0.7, y: height * 0.1 },
        { x: width * 0.96, y: height * 0.2 },
        { x: width * 0.91, y: height * 0.87 },
        { x: width * 0.68, y: height * 0.73 },
      ],
    },
  ];
}

export const mockServerWallAIProvider: ServerWallAIProvider = {
  name: "mock",
  async detectWalls({ dimensions }) {
    return createMockWallResults(dimensions);
  },
};
