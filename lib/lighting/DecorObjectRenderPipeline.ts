import { loadDecorAsset } from "@/lib/decor/loadDecorAsset";
import { processObjectCanvasAsync } from "@/lib/lighting/colorAdjustment";
import type { RenderQuality } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { LruCache } from "@/lib/cache/LruCache";

const MAX_CACHE_ENTRIES = 48;
const MAX_CACHE_BYTES = 96 * 1024 * 1024;
const cache = new LruCache<string, Promise<HTMLCanvasElement>>({ maxEntries: MAX_CACHE_ENTRIES, maxEstimatedBytes: MAX_CACHE_BYTES });

export function getDecorObjectRenderCacheStats() {
  const stats = cache.stats();
  return { entries: stats.entries, estimatedBytes: stats.estimatedBytes, maxEntries: stats.maxEntries, maxBytes: stats.maxEstimatedBytes };
}

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
  if (existing) {
    cache.delete(key);
    cache.set(key, existing);
    return existing;
  }
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
  const factor = quality === "draft" ? 0.5 : 1;
  cache.set(key, operation, Math.max(1, Math.round(object.width * factor)) * Math.max(1, Math.round(object.height * factor)) * 4);
  operation.then((canvas) => {
    if (cache.get(key) === operation) {
      cache.set(key, operation, canvas.width * canvas.height * 4);
    }
  }).catch(() => cache.delete(key));
  return operation;
}

export function clearDecorObjectRenderCache() {
  cache.clear();
}
