import type { ImageDimensions, ImagePoint } from "@/types/editor";
import { clampPointToImage } from "@/lib/geometry/maskGeometry";

export function distanceBetweenPoints(first: ImagePoint, second: ImagePoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function interpolatePoints(
  start: ImagePoint,
  end: ImagePoint,
  maximumSpacing: number,
) {
  const distance = distanceBetweenPoints(start, end);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, maximumSpacing)));
  return Array.from({ length: steps }, (_, index) => {
    const progress = (index + 1) / steps;
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    };
  });
}

export function clientPointToImage(
  clientPoint: ImagePoint,
  bounds: Pick<DOMRect, "left" | "top" | "width" | "height">,
  dimensions: ImageDimensions,
) {
  return clampPointToImage(
    {
      x: ((clientPoint.x - bounds.left) / bounds.width) * dimensions.width,
      y: ((clientPoint.y - bounds.top) / bounds.height) * dimensions.height,
    },
    dimensions,
  );
}

export function shouldAddBrushPoint(
  previous: ImagePoint | undefined,
  next: ImagePoint,
  brushSize: number,
) {
  return !previous || distanceBetweenPoints(previous, next) >= Math.max(1, brushSize * 0.08);
}
