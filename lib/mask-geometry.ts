import type { WallMask } from "@/types/editor";

export function maskHasExportableColor(mask: WallMask) {
  return mask.visible && Boolean(mask.color);
}

export function pointsToSvgString(mask: WallMask) {
  return mask.points?.map((point) => `${point.x},${point.y}`).join(" ") ?? "";
}

export function buildCanvasPath(mask: WallMask) {
  if (mask.path) {
    try {
      return new Path2D(mask.path);
    } catch {
      return null;
    }
  }

  if (!mask.points || mask.points.length < 3) {
    return null;
  }

  const path = new Path2D();
  const [firstPoint, ...remainingPoints] = mask.points;

  path.moveTo(firstPoint.x, firstPoint.y);
  remainingPoints.forEach((point) => path.lineTo(point.x, point.y));
  path.closePath();

  return path;
}
