import type { RgbColor } from "@/lib/colors/colorSpace";
import {
  createRenderCanvas,
  getRenderContext,
} from "@/lib/paint/renderCanvas";
import type { LoadedImage } from "@/types/editor";

export type SourceRaster = {
  data: Uint8ClampedArray;
  height: number;
  scale: number;
  width: number;
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const sourceRasterCache = new Map<string, Promise<SourceRaster>>();

function rememberLimited<K, V>(cache: Map<K, V>, key: K, value: V, limit: number) {
  cache.set(key, value);
  if (cache.size <= limit) return value;
  const oldestKey = cache.keys().next().value;
  if (oldestKey !== undefined) cache.delete(oldestKey);
  return value;
}

export function loadPaintImage(image: LoadedImage) {
  const cached = imageCache.get(image.url);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Image load failed."));
    element.src = image.url;
  });
  return rememberLimited(imageCache, image.url, pending, 4);
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
  return rememberLimited(sourceRasterCache, key, pending, 4);
}

export function readRasterRgb(data: Uint8ClampedArray, index: number): RgbColor {
  return {
    r: data[index] / 255,
    g: data[index + 1] / 255,
    b: data[index + 2] / 255,
  };
}
