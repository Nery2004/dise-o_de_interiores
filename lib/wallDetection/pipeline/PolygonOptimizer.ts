import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import { PolygonSimplifier } from "@/lib/wallDetection/pipeline/PolygonSimplifier";

function distanceToLine(point: WallDetectionPoint, start: WallDetectionPoint, end: WallDetectionPoint) {
  const denominator = Math.hypot(end.y - start.y, end.x - start.x);
  if (!denominator) return 0;
  return Math.abs((end.y - start.y) * point.x - (end.x - start.x) * point.y + end.x * start.y - end.y * start.x) / denominator;
}

export class PolygonOptimizer {
  private simplifier = new PolygonSimplifier();

  optimize(points: WallDetectionPoint[], tolerance: number): WallDetectionPoint[] {
    const simplified = this.simplifier.simplify(points, tolerance);
    if (simplified.length <= 3) return simplified;
    const optimized = simplified.filter((point, index, polygon) => {
      const previous = polygon[(index - 1 + polygon.length) % polygon.length];
      const next = polygon[(index + 1) % polygon.length];
      const firstAngle = Math.atan2(point.y - previous.y, point.x - previous.x);
      const secondAngle = Math.atan2(next.y - point.y, next.x - point.x);
      let turn = Math.abs(firstAngle - secondAngle);
      if (turn > Math.PI) turn = Math.PI * 2 - turn;
      const preciseCorner = turn > 0.18;
      return preciseCorner || distanceToLine(point, previous, next) > tolerance * 0.7;
    });
    return optimized.length >= 3 ? optimized : simplified;
  }
}
