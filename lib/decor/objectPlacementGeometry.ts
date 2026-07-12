import type { DecorObject } from "@/types/decor-object";
import type { ImageDimensions, ImagePoint } from "@/types/editor";
import type { ObjectResizeHandle, PlacedDecorObject } from "@/types/placed-decor-object";
import { viewportToImagePoint } from "@/lib/canvas/canvasTransformUtils";

export type ObjectBounds = { left: number; top: number; right: number; bottom: number; width: number; height: number };

const categoryWidthRatio: Record<DecorObject["category"], number> = {
  sillones: 0.38,
  sillas: 0.18,
  mesas: 0.27,
  macetas: 0.12,
  plantas: 0.18,
  lamparas: 0.17,
  alfombras: 0.42,
  cuadros: 0.2,
  estanterias: 0.22,
  decoracion: 0.13,
  camas: 0.42,
  escritorios: 0.3,
};

function rotatePoint(point: ImagePoint, angleDegrees: number): ImagePoint {
  const angle = angleDegrees * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return { x: point.x * cosine - point.y * sine, y: point.x * sine + point.y * cosine };
}

export function getInitialObjectSize(object: DecorObject, image: ImageDimensions) {
  const safeAssetWidth = Math.max(1, object.width);
  const safeAssetHeight = Math.max(1, object.height);
  const aspectRatio = safeAssetWidth / safeAssetHeight;
  const defaultAdjustment = Math.max(0.45, Math.min(1.8, (object.defaultScale ?? 0.3) / 0.3));
  let width = image.width * categoryWidthRatio[object.category] * defaultAdjustment;
  let height = width / aspectRatio;
  if (object.category === "lamparas" || object.category === "plantas" || object.category === "estanterias") {
    height = Math.min(image.height * 0.42 * defaultAdjustment, height);
    width = height * aspectRatio;
  }
  const maximumScale = Math.min(1, image.width * 0.78 / width, image.height * 0.78 / height);
  width *= maximumScale;
  height *= maximumScale;
  const minimum = Math.max(24, Math.min(image.width, image.height) * 0.04);
  if (Math.min(width, height) < minimum) {
    const multiplier = minimum / Math.min(width, height);
    width *= multiplier; height *= multiplier;
  }
  return { width, height, scaleX: width / safeAssetWidth, scaleY: height / safeAssetHeight };
}

export function clientPointToImagePoint(point: ImagePoint, bounds: Pick<DOMRect, "left" | "top" | "width" | "height">, image: ImageDimensions): ImagePoint {
  return viewportToImagePoint(point, bounds, image);
}

export function getObjectBounds(object: Pick<PlacedDecorObject, "x" | "y" | "width" | "height">): ObjectBounds {
  return { left: object.x - object.width / 2, top: object.y - object.height / 2, right: object.x + object.width / 2, bottom: object.y + object.height / 2, width: object.width, height: object.height };
}

export function getRotatedObjectBounds(object: Pick<PlacedDecorObject, "x" | "y" | "width" | "height" | "rotation">): ObjectBounds {
  const corners = [
    { x: -object.width / 2, y: -object.height / 2 }, { x: object.width / 2, y: -object.height / 2 },
    { x: object.width / 2, y: object.height / 2 }, { x: -object.width / 2, y: object.height / 2 },
  ].map((point) => { const rotated = rotatePoint(point, object.rotation); return { x: rotated.x + object.x, y: rotated.y + object.y }; });
  const xs = corners.map((point) => point.x); const ys = corners.map((point) => point.y);
  const left = Math.min(...xs); const right = Math.max(...xs); const top = Math.min(...ys); const bottom = Math.max(...ys);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

export function clampObjectToImage<T extends Pick<PlacedDecorObject, "x" | "y" | "width" | "height" | "rotation">>(object: T, image: ImageDimensions): T {
  let next = { ...object };
  const bounds = getRotatedObjectBounds(next);
  if (bounds.width > image.width || bounds.height > image.height) {
    const scale = Math.min(1, image.width / Math.max(1, bounds.width), image.height / Math.max(1, bounds.height));
    next = { ...next, width: next.width * scale, height: next.height * scale };
  }
  const adjusted = getRotatedObjectBounds(next);
  next.x += adjusted.left < 0 ? -adjusted.left : adjusted.right > image.width ? image.width - adjusted.right : 0;
  next.y += adjusted.top < 0 ? -adjusted.top : adjusted.bottom > image.height ? image.height - adjusted.bottom : 0;
  return next;
}

function handleSigns(handle: ObjectResizeHandle) {
  return { x: handle.endsWith("east") ? 1 : -1, y: handle.startsWith("south") ? 1 : -1 };
}

export function resizeObjectFromHandle(object: PlacedDecorObject, handle: ObjectResizeHandle, pointer: ImagePoint, image: ImageDimensions, preserveAspectRatio = true) {
  const signs = handleSigns(handle);
  const pointerRelative = rotatePoint({ x: pointer.x - object.x, y: pointer.y - object.y }, -object.rotation);
  const opposite = { x: -signs.x * object.width / 2, y: -signs.y * object.height / 2 };
  let width = Math.max(16, Math.abs(pointerRelative.x - opposite.x));
  let height = Math.max(16, Math.abs(pointerRelative.y - opposite.y));
  const ratio = object.originalWidth / Math.max(1, object.originalHeight);
  if (preserveAspectRatio) {
    if (width / Math.max(1, object.width) >= height / Math.max(1, object.height)) height = width / ratio;
    else width = height * ratio;
  }
  const maxWidth = image.width * 0.95; const maxHeight = image.height * 0.95;
  const maxScale = Math.min(1, maxWidth / width, maxHeight / height);
  width *= maxScale; height *= maxScale;
  const adjustedPointer = { x: opposite.x + signs.x * width, y: opposite.y + signs.y * height };
  const centerOffset = rotatePoint({ x: (opposite.x + adjustedPointer.x) / 2, y: (opposite.y + adjustedPointer.y) / 2 }, object.rotation);
  const resized = clampObjectToImage({ ...object, x: object.x + centerOffset.x, y: object.y + centerOffset.y, width, height, scaleX: width / object.originalWidth, scaleY: height / object.originalHeight }, image);
  return { ...resized, scaleX: resized.width / object.originalWidth, scaleY: resized.height / object.originalHeight };
}

function pointerAngle(center: ImagePoint, pointer: ImagePoint) {
  return Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180 / Math.PI;
}

export function rotateObjectFromPointer(object: PlacedDecorObject, startPointer: ImagePoint, currentPointer: ImagePoint, snap = false) {
  const angle = object.rotation + pointerAngle(object, currentPointer) - pointerAngle(object, startPointer);
  const normalized = ((angle + 180) % 360 + 360) % 360 - 180;
  return snap ? Math.round(normalized / 15) * 15 : Math.round(normalized * 10) / 10;
}

export function normalizeObjectZIndexes(objects: PlacedDecorObject[]) {
  return [...objects].sort((first, second) => first.zIndex - second.zIndex || first.createdAt.localeCompare(second.createdAt)).map((object, index) => ({ ...object, zIndex: index }));
}
