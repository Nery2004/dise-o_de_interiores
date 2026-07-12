import type { ImageDimensions, ImagePoint } from "@/types/editor";
import type { PerspectivePoints, PlacementSurface } from "@/types/perspective";

export function pointInPolygon(point: ImagePoint, polygon: ImagePoint[]) {
  if (polygon.length < 3) return false;
  let inside = false;
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const first = polygon[index];
    const second = polygon[previous];
    const intersects =
      first.y > point.y !== second.y > point.y &&
      point.x <
        ((second.x - first.x) * (point.y - first.y)) /
          (second.y - first.y || Number.EPSILON) +
          first.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function polygonBounds(points: ImagePoint[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

export function polygonCentroid(points: ImagePoint[]): ImagePoint {
  if (!points.length) return { x: 0, y: 0 };
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

export function distanceToSegment(
  point: ImagePoint,
  start: ImagePoint,
  end: ImagePoint,
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared
    ? Math.max(
        0,
        Math.min(
          1,
          ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
        ),
      )
    : 0;
  return Math.hypot(
    point.x - (start.x + amount * dx),
    point.y - (start.y + amount * dy),
  );
}

export function distanceToPolygon(point: ImagePoint, polygon: ImagePoint[]) {
  if (pointInPolygon(point, polygon)) return 0;
  return Math.min(
    ...polygon.map((current, index) =>
      distanceToSegment(point, current, polygon[(index + 1) % polygon.length]),
    ),
  );
}

export function clampPointToImage(
  point: ImagePoint,
  image: ImageDimensions,
): ImagePoint {
  return {
    x: Math.max(0, Math.min(image.width, point.x)),
    y: Math.max(0, Math.min(image.height, point.y)),
  };
}

export function translateSurface(
  surface: PlacementSurface,
  dx: number,
  dy: number,
  image: ImageDimensions,
): PlacementSurface {
  const bounds = polygonBounds(surface.points);
  const safeDx = Math.max(
    -bounds.left,
    Math.min(image.width - bounds.right, dx),
  );
  const safeDy = Math.max(
    -bounds.top,
    Math.min(image.height - bounds.bottom, dy),
  );
  return {
    ...surface,
    points: surface.points.map((point) => ({
      x: point.x + safeDx,
      y: point.y + safeDy,
    })),
  };
}

export function perspectivePointsArray(points: PerspectivePoints) {
  return [
    points.topLeft,
    points.topRight,
    points.bottomRight,
    points.bottomLeft,
  ];
}

export function perspectivePointsFromArray(
  points: ImagePoint[],
): PerspectivePoints {
  return {
    topLeft: points[0],
    topRight: points[1],
    bottomRight: points[2],
    bottomLeft: points[3],
  };
}

export function createHeuristicSurfaces(
  image: ImageDimensions,
): PlacementSurface[] {
  const now = new Date().toISOString();
  const surface = (
    name: string,
    type: PlacementSurface["type"],
    points: ImagePoint[],
  ): PlacementSurface => ({
    id: crypto.randomUUID(),
    name,
    type,
    points,
    visible: true,
    locked: false,
    selected: false,
    detected: true,
    snapEnabled: true,
    createdAt: now,
    updatedAt: now,
  });
  return [
    surface("Pared principal (heurística)", "wall", [
      { x: image.width * 0.04, y: image.height * 0.04 },
      { x: image.width * 0.96, y: image.height * 0.04 },
      { x: image.width * 0.88, y: image.height * 0.72 },
      { x: image.width * 0.12, y: image.height * 0.72 },
    ]),
    surface("Piso (heurística)", "floor", [
      { x: image.width * 0.12, y: image.height * 0.68 },
      { x: image.width * 0.88, y: image.height * 0.68 },
      { x: image.width, y: image.height },
      { x: 0, y: image.height },
    ]),
  ];
}
