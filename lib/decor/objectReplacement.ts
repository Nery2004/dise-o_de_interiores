import type { DecorObject } from "@/types/decor-object";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function replacePlacedObjectAsset(object: PlacedDecorObject, replacement: Pick<DecorObject, "id" | "name" | "assetUrl" | "assetType" | "width" | "height">): PlacedDecorObject {
  return {
    ...object,
    decorObjectId: replacement.id,
    name: replacement.name,
    assetUrl: replacement.assetUrl,
    assetType: replacement.assetType,
    originalWidth: replacement.width,
    originalHeight: replacement.height,
    scaleX: object.width / replacement.width,
    scaleY: object.height / replacement.height,
    updatedAt: new Date().toISOString(),
  };
}
