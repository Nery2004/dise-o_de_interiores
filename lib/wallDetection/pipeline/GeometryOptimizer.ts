import type { WallDetectionPoint } from "@/lib/wallDetection/types";

export class GeometryOptimizer {
  optimize(points: WallDetectionPoint[], width: number, height: number): WallDetectionPoint[] {
    const snapDistance = Math.max(width, height) * 0.008;
    const snapped = points.map((point) => ({
      x: point.x <= snapDistance ? 0 : width - point.x <= snapDistance ? width : point.x,
      y: point.y <= snapDistance ? 0 : height - point.y <= snapDistance ? height : point.y,
    }));
    return snapped.filter((point, index) => {
      const previous = snapped[(index - 1 + snapped.length) % snapped.length];
      return Math.hypot(point.x - previous.x, point.y - previous.y) >= 0.5;
    });
  }
}
