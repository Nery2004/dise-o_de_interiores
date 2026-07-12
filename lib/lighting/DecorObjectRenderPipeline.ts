import { loadDecorAsset } from "@/lib/decor/loadDecorAsset";
import { processObjectCanvasAsync } from "@/lib/lighting/colorAdjustment";
import type { RenderQuality } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

const cache = new Map<string, Promise<HTMLCanvasElement>>();
const MAX_CACHE_ENTRIES = 48;

export function objectRenderCacheKey(object: PlacedDecorObject, quality: RenderQuality) {
  return JSON.stringify([
    object.assetUrl, Math.round(object.width), Math.round(object.height), object.flipX, object.flipY,
    object.brightness, object.contrast, object.saturation, object.temperature, object.tint,
    object.exposure, object.highlights, object.shadows, object.sharpness, object.depthBlur,
    object.grain, quality,
  ]);
}

export async function renderDecorObjectAsset(
  object: PlacedDecorObject,
  quality: RenderQuality = "high",
) {
  const key = objectRenderCacheKey(object, quality);
  const existing = cache.get(key);
  if (existing) return existing;
  const operation = loadDecorAsset(object.assetUrl).then(async (image) => {
    const factor = quality === "draft" ? 0.5 : 1;
    const source = document.createElement("canvas");
    source.width = Math.max(1, Math.round(object.width * factor));
    source.height = Math.max(1, Math.round(object.height * factor));
    const context = source.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.translate(object.flipX ? source.width : 0, object.flipY ? source.height : 0);
    context.scale(object.flipX ? -1 : 1, object.flipY ? -1 : 1);
    context.drawImage(image, 0, 0, source.width, source.height);
    if (object.lightingMode === "none") return source;
    return processObjectCanvasAsync(source, source.width, source.height, object);
  });
  cache.set(key, operation);
  if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
  operation.catch(() => cache.delete(key));
  return operation;
}

export function clearDecorObjectRenderCache() {
  cache.clear();
}
