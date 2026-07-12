import type { CSSProperties } from "react";
import type { ImageDimensions, ImagePoint, NormalizedPoint, ScreenPoint, ViewportPoint } from "@/types/editor";

export const CANVAS_MAX_SCALE = 4;
export const CANVAS_FIT_PADDING = 32;
export const CANVAS_MIN_VISIBLE_PIXELS = 64;

export type CanvasTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export type ComparisonDirection = "vertical" | "horizontal";

export function calculateFitScale(
  viewport: ViewportSize,
  image: ImageDimensions,
  padding = CANVAS_FIT_PADDING,
) {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return 1;
  }

  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  return Math.min(
    CANVAS_MAX_SCALE,
    availableWidth / image.width,
    availableHeight / image.height,
  );
}

export function clampZoom(
  scale: number,
  fitScale: number,
  maximumScale = CANVAS_MAX_SCALE,
) {
  const safeFitScale = Math.max(Number.EPSILON, fitScale);
  return Math.min(
    Math.max(scale, safeFitScale),
    Math.max(safeFitScale, maximumScale),
  );
}

export function clampTranslation(
  transform: CanvasTransform,
  viewport: ViewportSize,
  image: ImageDimensions,
  minimumVisiblePixels = CANVAS_MIN_VISIBLE_PIXELS,
): CanvasTransform {
  const displayedWidth = image.width * transform.scale;
  const displayedHeight = image.height * transform.scale;
  const visibleX = Math.min(minimumVisiblePixels, displayedWidth / 2);
  const visibleY = Math.min(minimumVisiblePixels, displayedHeight / 2);
  const maximumX = Math.max(
    0,
    viewport.width / 2 + displayedWidth / 2 - visibleX,
  );
  const maximumY = Math.max(
    0,
    viewport.height / 2 + displayedHeight / 2 - visibleY,
  );

  return {
    ...transform,
    translateX: Math.min(maximumX, Math.max(-maximumX, transform.translateX)),
    translateY: Math.min(maximumY, Math.max(-maximumY, transform.translateY)),
  };
}

export function getCanvasTransformStyle(
  transform: CanvasTransform,
): Pick<CSSProperties, "transform" | "transformOrigin"> {
  return {
    transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
    transformOrigin: "center center",
  };
}

export function getComparisonClipPath(
  direction: ComparisonDirection,
  position: number,
) {
  const safePosition = Math.min(100, Math.max(0, position));
  return direction === "vertical"
    ? `inset(0 ${100 - safePosition}% 0 0)`
    : `inset(0 0 ${100 - safePosition}% 0)`;
}

export function screenToImagePoint(
  point: ScreenPoint,
  viewport: ViewportSize,
  image: ImageDimensions,
  transform: CanvasTransform,
): ImagePoint {
  return {
    x:
      image.width / 2 +
      (point.x - viewport.width / 2 - transform.translateX) / transform.scale,
    y:
      image.height / 2 +
      (point.y - viewport.height / 2 - transform.translateY) / transform.scale,
  };
}

export function imagePointToScreenPoint(
  point: ImagePoint,
  viewport: ViewportSize,
  image: ImageDimensions,
  transform: CanvasTransform,
): ScreenPoint {
  return {
    x:
      viewport.width / 2 +
      transform.translateX +
      (point.x - image.width / 2) * transform.scale,
    y:
      viewport.height / 2 +
      transform.translateY +
      (point.y - image.height / 2) * transform.scale,
  };
}

export const screenPointToImagePoint = screenToImagePoint;

export function imageToScreenPoint(
  point: ImagePoint,
  viewport: ViewportSize,
  image: ImageDimensions,
  transform: CanvasTransform,
) {
  return imagePointToScreenPoint(point, viewport, image, transform);
}

export function viewportToImagePoint(
  point: ViewportPoint,
  bounds: Pick<DOMRect, "left" | "top" | "width" | "height">,
  image: ImageDimensions,
): ImagePoint {
  return {
    x: Math.min(image.width, Math.max(0, (point.x - bounds.left) * image.width / Math.max(1, bounds.width))),
    y: Math.min(image.height, Math.max(0, (point.y - bounds.top) * image.height / Math.max(1, bounds.height))),
  };
}

export function imageToNormalizedPoint(point: ImagePoint, image: ImageDimensions): NormalizedPoint {
  return { x: point.x / Math.max(1, image.width), y: point.y / Math.max(1, image.height) };
}

export function normalizedToImagePoint(point: NormalizedPoint, image: ImageDimensions): ImagePoint {
  return { x: Math.min(1, Math.max(0, point.x)) * image.width, y: Math.min(1, Math.max(0, point.y)) * image.height };
}
