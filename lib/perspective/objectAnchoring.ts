import { decorObjects } from "@/data/decorObjects";
import { getPerspectiveScale } from "@/lib/perspective/depthScale";
import {
  distanceToPolygon,
  pointInPolygon,
  polygonBounds,
} from "@/lib/perspective/surfaceGeometry";
import type { DecorObject, DecorObjectCategory } from "@/types/decor-object";
import type { ImageDimensions, ImagePoint } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type {
  ObjectAnchor,
  PerspectivePoints,
  PlacementSurface,
  PlacementSurfaceType,
} from "@/types/perspective";

const floorCategories = new Set<DecorObjectCategory>([
  "sillones",
  "sillas",
  "mesas",
  "macetas",
  "plantas",
  "alfombras",
  "camas",
  "escritorios",
]);

export function defaultPlacementForCategory(category: DecorObjectCategory): {
  surfaceType: PlacementSurfaceType;
  anchor: ObjectAnchor;
  autoScaleByDepth: boolean;
} {
  if (category === "cuadros" || category === "estanterias")
    return { surfaceType: "wall", anchor: "center", autoScaleByDepth: false };
  if (category === "lamparas")
    return {
      surfaceType: "ceiling",
      anchor: "top-center",
      autoScaleByDepth: true,
    };
  if (floorCategories.has(category))
    return {
      surfaceType: "floor",
      anchor: "bottom-center",
      autoScaleByDepth: true,
    };
  return { surfaceType: "free", anchor: "center", autoScaleByDepth: false };
}

export function categoryForPlacedObject(
  object: Pick<PlacedDecorObject, "decorObjectId">,
) {
  return (
    decorObjects.find((item) => item.id === object.decorObjectId)?.category ??
    "decoracion"
  );
}

export function compatibleSurface(
  surface: PlacementSurface,
  preferred: PlacementSurfaceType,
) {
  return (
    preferred === "free" ||
    surface.type === preferred ||
    surface.type === "free" ||
    (preferred === "floor" && surface.type === "table")
  );
}

export function findSurfaceAtPoint(
  surfaces: PlacementSurface[],
  point: ImagePoint,
  preferred: PlacementSurfaceType,
  tolerance = 16,
) {
  return [...surfaces]
    .reverse()
    .find(
      (surface) =>
        surface.visible &&
        surface.snapEnabled &&
        compatibleSurface(surface, preferred) &&
        (pointInPolygon(point, surface.points) ||
          distanceToPolygon(point, surface.points) <= tolerance),
    );
}

export function depthAtPoint(
  surface: PlacementSurface | undefined,
  point: ImagePoint,
  image: ImageDimensions,
) {
  if (!surface) return Math.max(0, Math.min(1, point.y / image.height));
  const bounds = polygonBounds(surface.points);
  if (surface.type === "wall" || surface.type === "ceiling")
    return Math.max(
      0,
      Math.min(1, (point.y - bounds.top) / Math.max(1, bounds.height)),
    );
  return Math.max(
    0,
    Math.min(1, (point.y - bounds.top) / Math.max(1, bounds.height)),
  );
}

export function objectAnchorPoint(
  object: Pick<
    PlacedDecorObject,
    "x" | "y" | "height" | "anchor" | "baseContactOffset"
  >,
): ImagePoint {
  if (object.anchor === "bottom-center")
    return {
      x: object.x,
      y: object.y + object.height / 2 + object.baseContactOffset,
    };
  if (object.anchor === "top-center")
    return {
      x: object.x,
      y: object.y - object.height / 2 - object.baseContactOffset,
    };
  return { x: object.x, y: object.y };
}

export function centerFromAnchor(
  point: ImagePoint,
  height: number,
  anchor: ObjectAnchor,
  offset = 0,
): ImagePoint {
  if (anchor === "bottom-center")
    return { x: point.x, y: point.y - height / 2 - offset };
  if (anchor === "top-center")
    return { x: point.x, y: point.y + height / 2 + offset };
  return point;
}

export function initialDepthScale(
  object: DecorObject,
  depth: number,
  enabled: boolean,
) {
  return enabled ? getPerspectiveScale(depth, object.category) : 1;
}

export function rectanglePerspectivePoints(
  object: Pick<PlacedDecorObject, "x" | "y" | "width" | "height">,
): PerspectivePoints {
  return {
    topLeft: {
      x: object.x - object.width / 2,
      y: object.y - object.height / 2,
    },
    topRight: {
      x: object.x + object.width / 2,
      y: object.y - object.height / 2,
    },
    bottomRight: {
      x: object.x + object.width / 2,
      y: object.y + object.height / 2,
    },
    bottomLeft: {
      x: object.x - object.width / 2,
      y: object.y + object.height / 2,
    },
  };
}

export function fitObjectToSurface(
  object: PlacedDecorObject,
  surface: PlacementSurface,
): PerspectivePoints {
  const bounds = polygonBounds(surface.points);
  if (surface.type === "floor" || surface.type === "table") {
    const contact = objectAnchorPoint(object);
    const halfBottom = Math.min(object.width * 0.55, bounds.width * 0.45);
    const halfTop = halfBottom * (0.5 + object.depth * 0.25);
    const height = Math.min(object.height * 0.62, bounds.height * 0.7);
    return {
      topLeft: { x: contact.x - halfTop, y: contact.y - height },
      topRight: { x: contact.x + halfTop, y: contact.y - height },
      bottomRight: { x: contact.x + halfBottom, y: contact.y },
      bottomLeft: { x: contact.x - halfBottom, y: contact.y },
    };
  }
  return rectanglePerspectivePoints(object);
}
