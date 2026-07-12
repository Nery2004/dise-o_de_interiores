import type { WallDetectionPoint } from "@/lib/wallDetection/types";

function distanceToSegment(point: WallDetectionPoint, start: WallDetectionPoint, end: WallDetectionPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function rdp(points: WallDetectionPoint[], tolerance: number): WallDetectionPoint[] {
  if (points.length <= 2) return points;
  let maximum = 0;
  let split = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(points[index], points[0], points[points.length - 1]);
    if (distance > maximum) { maximum = distance; split = index; }
  }
  if (maximum <= tolerance) return [points[0], points[points.length - 1]];
  return [...rdp(points.slice(0, split + 1), tolerance).slice(0, -1), ...rdp(points.slice(split), tolerance)];
}

export class PolygonSimplifier {
  simplify(contour: WallDetectionPoint[], tolerance: number): WallDetectionPoint[] {
    if (contour.length <= 3) return contour;
    let anchor = 0;
    for (let index = 1; index < contour.length; index += 1) if (contour[index].x < contour[anchor].x) anchor = index;
    const rotated = [...contour.slice(anchor), ...contour.slice(0, anchor), contour[anchor]];
    const simplified = rdp(rotated, Math.max(0.25, tolerance));
    return simplified.slice(0, -1).length >= 3 ? simplified.slice(0, -1) : contour;
  }
}
