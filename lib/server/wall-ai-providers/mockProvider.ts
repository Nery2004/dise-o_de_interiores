import type { ServerWallAIProvider } from "@/lib/server/wall-ai-providers/types";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

function createWallId(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function rasterizePolygon(width: number, height: number, points: Array<{ x: number; y: number }>): BinaryMask {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    let inside = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
      const a = points[index]; const b = points[previous];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    if (inside) data[y * width + x] = 1;
  }
  return { width, height, data };
}

export const mockServerWallAIProvider: ServerWallAIProvider = {
  name: "mock",
  version: "synthetic-raster-v2",
  async segmentWalls({ processingDimensions: { width, height } }) {
    const definitions = [
      ["Pared izquierda", 0.9, [[0.04, 0.16], [0.35, 0.08], [0.39, 0.76], [0.07, 0.88]]],
      ["Pared fondo", 0.92, [[0.34, 0.08], [0.7, 0.1], [0.68, 0.73], [0.39, 0.76]]],
      ["Pared derecha", 0.87, [[0.7, 0.1], [0.96, 0.2], [0.91, 0.87], [0.68, 0.73]]],
    ] as const;
    return {
      modelVersion: this.version,
      regions: definitions.map(([name, confidence, points]) => ({
        id: createWallId(name), name, confidence,
        mask: rasterizePolygon(width, height, points.map(([x, y]) => ({ x: x * width, y: y * height }))),
      })),
    };
  },
};
