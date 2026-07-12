import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import type { ArchitectureLine } from "@/lib/wallDetection/pipeline/types";

function intersection(first: ArchitectureLine, second: ArchitectureLine): WallDetectionPoint | null {
  const determinant = first.a * second.b - second.a * first.b;
  if (Math.abs(determinant) < 0.08) return null;
  return {
    x: (first.b * second.c - second.b * first.c) / determinant,
    y: (first.c * second.a - second.c * first.a) / determinant,
  };
}

export class CornerSnapper {
  snap(points: WallDetectionPoint[], lines: ArchitectureLine[], width: number, height: number, maximumDistance: number): WallDetectionPoint[] {
    const anchors: WallDetectionPoint[] = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
    for (let first = 0; first < lines.length; first += 1) for (let second = first + 1; second < lines.length; second += 1) {
      const point = intersection(lines[first], lines[second]);
      if (point && point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height) anchors.push(point);
    }
    return points.map((point) => {
      const nearest = anchors.map((anchor) => ({ anchor, distance: Math.hypot(anchor.x - point.x, anchor.y - point.y) }))
        .sort((a, b) => a.distance - b.distance)[0];
      return nearest && nearest.distance <= maximumDistance ? nearest.anchor : point;
    });
  }
}
