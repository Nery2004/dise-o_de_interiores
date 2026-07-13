import type { RgbColor } from "@/lib/colors/colorSpace";
import {
  createRenderCanvas,
  getRenderContext,
} from "@/lib/paint/renderCanvas";
import type { LoadedImage } from "@/types/editor";
import { LruCache } from "@/lib/cache/LruCache";

export type SourceRaster = {
  data: Uint8ClampedArray;
  height: number;
  scale: number;
  width: number;
};

const imageCache = new LruCache<string, Promise<HTMLImageElement>>({ maxEntries: 4, maxEstimatedBytes: 1 });
const sourceRasterCache = new LruCache<string, Promise<SourceRaster>>({ maxEntries: 4, maxEstimatedBytes: 128 * 1024 * 1024 });

export function loadPaintImage(image: LoadedImage) {
  const cached = imageCache.get(image.url);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Image load failed."));
    element.src = image.url;
  });
  imageCache.set(image.url, pending);
  pending.catch(() => imageCache.delete(image.url));
  return pending;
}

export function getSourceRaster(image: LoadedImage, scale: number) {
  const key = `${image.url}:${scale}`;
  const cached = sourceRasterCache.get(key);
  if (cached) return cached;
  const pending = loadPaintImage(image).then((element) => {
    const width = Math.max(1, Math.round(image.dimensions.width * scale));
    const height = Math.max(1, Math.round(image.dimensions.height * scale));
    const canvas = createRenderCanvas(width, height);
    const context = getRenderContext(canvas);
    context.imageSmoothingEnabled = true;
    context.drawImage(element, 0, 0, width, height);
    return {
      data: context.getImageData(0, 0, width, height).data,
      height,
      scale,
      width,
    };
  });
  sourceRasterCache.set(
    key,
    pending,
    Math.max(1, Math.round(image.dimensions.width * scale)) * Math.max(1, Math.round(image.dimensions.height * scale)) * 4,
  );
  pending.catch(() => sourceRasterCache.delete(key));
  return pending;
}

export function getPaintRasterCacheStats() {
  return { images: imageCache.stats(), rasters: sourceRasterCache.stats() };
}

export function clearPaintRasterCache() {
  imageCache.clear();
  sourceRasterCache.clear();
}

export function readRasterRgb(data: Uint8ClampedArray, index: number): RgbColor {
  return {
    r: data[index] / 255,
    g: data[index + 1] / 255,
    b: data[index + 2] / 255,
  };
}
