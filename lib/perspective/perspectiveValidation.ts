import type { ImagePoint } from "@/types/editor";
import type { PerspectivePoints } from "@/types/perspective";
import { perspectivePointsArray } from "@/lib/perspective/surfaceGeometry";

function orientation(a: ImagePoint, b: ImagePoint, c: ImagePoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(
  a: ImagePoint,
  b: ImagePoint,
  c: ImagePoint,
  d: ImagePoint,
) {
  return (
    orientation(a, b, c) * orientation(a, b, d) < 0 &&
    orientation(c, d, a) * orientation(c, d, b) < 0
  );
}

export function quadrilateralArea(points: PerspectivePoints) {
  const values = perspectivePointsArray(points);
  return (
    Math.abs(
      values.reduce((sum, point, index) => {
        const next = values[(index + 1) % values.length];
        return sum + point.x * next.y - next.x * point.y;
      }, 0),
    ) / 2
  );
}

export function validatePerspectivePoints(points: PerspectivePoints) {
  const values = perspectivePointsArray(points);
  if (
    values.some(
      (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
    )
  )
    return false;
  if (quadrilateralArea(points) < 16) return false;
  if (
    segmentsIntersect(values[0], values[1], values[2], values[3]) ||
    segmentsIntersect(values[1], values[2], values[3], values[0])
  )
    return false;
  const signs = values.map((point, index) =>
    orientation(point, values[(index + 1) % 4], values[(index + 2) % 4]),
  );
  return signs.every((sign) => sign > 0) || signs.every((sign) => sign < 0);
}
