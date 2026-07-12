import type { ImageDimensions, ImagePoint } from "@/types/editor";

export function clampPointToImage(
  point: ImagePoint,
  dimensions: ImageDimensions,
): ImagePoint {
  return {
    x: Math.min(Math.max(point.x, 0), dimensions.width),
    y: Math.min(Math.max(point.y, 0), dimensions.height),
  };
}

function closestPointOnSegment(
  point: ImagePoint,
  start: ImagePoint,
  end: ImagePoint,
): { point: ImagePoint; distance: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.min(
          1,
          Math.max(
            0,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) /
              lengthSquared,
          ),
        );
  const projected = { x: start.x + t * dx, y: start.y + t * dy };

  return {
    point: projected,
    distance: Math.hypot(point.x - projected.x, point.y - projected.y),
  };
}

export function findNearestPolygonEdge(points: ImagePoint[], point: ImagePoint) {
  if (points.length < 2) {
    return null;
  }

  return points.reduce<{
    startIndex: number;
    endIndex: number;
    point: ImagePoint;
    distance: number;
  } | null>((nearest, start, startIndex) => {
    const endIndex = (startIndex + 1) % points.length;
    const result = closestPointOnSegment(point, start, points[endIndex]);

    if (!nearest || result.distance < nearest.distance) {
      return { startIndex, endIndex, ...result };
    }

    return nearest;
  }, null);
}

export function insertPointBetween(
  points: ImagePoint[],
  startIndex: number,
  point: ImagePoint,
) {
  const next = [...points];
  next.splice(startIndex + 1, 0, point);
  return next;
}

export function movePolygonWithinImage(
  points: ImagePoint[],
  delta: ImagePoint,
  dimensions: ImageDimensions,
) {
  if (points.length === 0) {
    return points;
  }

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const dx = Math.min(Math.max(delta.x, -minX), dimensions.width - maxX);
  const dy = Math.min(Math.max(delta.y, -minY), dimensions.height - maxY);

  return points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
}

export function hasMinimumPolygonPoints(points: ImagePoint[]) {
  return points.length >= 3;
}

export function clonePoints(points?: ImagePoint[]) {
  return points?.map((point) => ({ ...point }));
}
