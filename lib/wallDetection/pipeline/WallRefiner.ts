import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import { GeometryOptimizer } from "@/lib/wallDetection/pipeline/GeometryOptimizer";

export class WallRefiner {
  private geometry = new GeometryOptimizer();

  refine(points: WallDetectionPoint[], width: number, height: number): WallDetectionPoint[] {
    return this.geometry.optimize(points, width, height);
  }
}
