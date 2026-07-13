/// <reference lib="webworker" />

import { PolygonOptimizer } from "@/lib/wallDetection/pipeline/PolygonOptimizer";
import type { WallDetectionResult } from "@/lib/wallDetection/types";

type RequestMessage = { id: number; walls: WallDetectionResult[]; tolerance: number };

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const optimizer = new PolygonOptimizer();
  const walls = event.data.walls.map((wall) => {
    const points = optimizer.optimize(wall.points, event.data.tolerance);
    return { ...wall, points, refinement: wall.refinement ? { ...wall.refinement, pointCount: points.length } : undefined };
  });
  self.postMessage({ id: event.data.id, walls });
};

export {};
