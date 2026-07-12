import { maskHasExportableColor } from "@/lib/mask-geometry";
import { applyMaskFeatherPass } from "@/lib/paint/MaskFeatherPass";
import { processPaintPixel } from "@/lib/paint/PaintPipeline";
import {
  hexToRgb,
  rgbToOklab,
  type RgbColor,
} from "@/lib/paint/colorMath";
import {
  PAINT_QUALITY_SCALE,
  resolvePaintSettings,
} from "@/lib/paint/paintSettings";
import { createLocalLuminanceField } from "@/lib/paint/TexturePass";
import {
  createRenderCanvas,
  getRenderContext,
  type RenderCanvas,
} from "@/lib/paint/renderCanvas";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";

type SourceRaster = {
  data: Uint8ClampedArray;
  height: number;
  scale: number;
  width: number;
};

type RenderedMaskLayer = {
  canvas: RenderCanvas;
  height: number;
  scale: number;
  width: number;
  x: number;
  y: number;
};

type RenderPaintSceneOptions = {
  canvas: HTMLCanvasElement;
  globalBlendMode: BlendMode;
  image: LoadedImage;
  includeOriginal: boolean;
  masks: WallMask[];
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const sourceRasterCache = new Map<string, Promise<SourceRaster>>();
const layerCache = new Map<string, Promise<RenderedMaskLayer | null>>();

function rememberLimited<K, V>(cache: Map<K, V>, key: K, value: V, limit: number) {
  cache.set(key, value);
  if (cache.size <= limit) return value;
  const oldestKey = cache.keys().next().value;
  if (oldestKey !== undefined) cache.delete(oldestKey);
  return value;
}

function loadImage(image: LoadedImage) {
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

async function getSourceRaster(image: LoadedImage, scale: number) {
  const key = `${image.url}:${scale}`;
  const cached = sourceRasterCache.get(key);
  if (cached) return cached;
  const pending = loadImage(image).then((element) => {
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

function maskCacheKey(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
) {
  return `${image.url}:${JSON.stringify({
    blendMode: mask.blendMode ?? globalBlendMode,
    color: mask.color,
    edgeFeather: mask.edgeFeather,
    paintIntensity: mask.paintIntensity,
    paintMode: mask.paintMode,
    path: mask.path,
    points: mask.points,
    primerCoverage: mask.primerCoverage,
    refinement: mask.refinement,
    renderQuality: mask.renderQuality,
  })}`;
}

function readRgb(data: Uint8ClampedArray, index: number): RgbColor {
  return {
    r: data[index] / 255,
    g: data[index + 1] / 255,
    b: data[index + 2] / 255,
  };
}

async function renderMaskLayer(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
): Promise<RenderedMaskLayer | null> {
  if (!mask.color) return null;
  const settings = resolvePaintSettings(mask, globalBlendMode);
  const scale = PAINT_QUALITY_SCALE[settings.renderQuality];
  const source = await getSourceRaster(image, scale);
  const featheredMask = applyMaskFeatherPass(
    mask,
    image.dimensions,
    scale,
    settings.edgeFeather,
  );
  if (!featheredMask) return null;

  const { bounds, alpha } = featheredMask;
  const pixelCount = bounds.width * bounds.height;
  const luminance = new Float32Array(pixelCount);
  let weightedLuminance = 0;
  let totalWeight = 0;

  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const sourceX = bounds.x + x;
      const sourceY = bounds.y + y;
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const cropIndex = y * bounds.width + x;
      const value = rgbToOklab(readRgb(source.data, sourceIndex)).l;
      const weight = alpha[sourceY * source.width + sourceX] / 255;
      luminance[cropIndex] = value;
      weightedLuminance += value * weight;
      totalWeight += weight;
    }
  }

  const averageLuminance =
    totalWeight > 0 ? weightedLuminance / totalWeight : 0.7;
  const blurRadius = settings.renderQuality === "draft" ? 1 : settings.renderQuality === "high" ? 2 : 3;
  const localLuminance = createLocalLuminanceField(
    luminance,
    bounds.width,
    bounds.height,
    blurRadius,
  );
  const target = hexToRgb(mask.color);
  const layerCanvas = createRenderCanvas(bounds.width, bounds.height);
  const layerContext = getRenderContext(layerCanvas);
  const output = layerContext.createImageData(bounds.width, bounds.height);

  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const sourceX = bounds.x + x;
      const sourceY = bounds.y + y;
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const cropIndex = y * bounds.width + x;
      const outputIndex = cropIndex * 4;
      const maskAlpha = alpha[sourceY * source.width + sourceX];
      if (maskAlpha === 0) continue;
      const painted = processPaintPixel({
        averageLuminance,
        localLuminance: localLuminance[cropIndex],
        settings,
        source: readRgb(source.data, sourceIndex),
        target,
      });
      output.data[outputIndex] = Math.round(painted.r * 255);
      output.data[outputIndex + 1] = Math.round(painted.g * 255);
      output.data[outputIndex + 2] = Math.round(painted.b * 255);
      output.data[outputIndex + 3] = maskAlpha;
    }
  }
  layerContext.putImageData(output, 0, 0);
  return {
    canvas: layerCanvas,
    height: bounds.height,
    scale,
    width: bounds.width,
    x: bounds.x,
    y: bounds.y,
  };
}

function getRenderedMaskLayer(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
) {
  const key = maskCacheKey(image, mask, globalBlendMode);
  const cached = layerCache.get(key);
  if (cached) return cached;
  const pending = renderMaskLayer(image, mask, globalBlendMode);
  return rememberLimited(layerCache, key, pending, 24);
}

export async function renderPaintScene({
  canvas,
  globalBlendMode,
  image,
  includeOriginal,
  masks,
}: RenderPaintSceneOptions) {
  canvas.width = image.dimensions.width;
  canvas.height = image.dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;

  if (includeOriginal) {
    context.drawImage(
      await loadImage(image),
      0,
      0,
      image.dimensions.width,
      image.dimensions.height,
    );
  }

  const visibleMasks = masks.filter(maskHasExportableColor);
  const layers = await Promise.all(
    visibleMasks.map((mask) =>
      getRenderedMaskLayer(image, mask, globalBlendMode),
    ),
  );
  layers.forEach((layer) => {
    if (!layer) return;
    context.drawImage(
      layer.canvas,
      0,
      0,
      layer.width,
      layer.height,
      layer.x / layer.scale,
      layer.y / layer.scale,
      layer.width / layer.scale,
      layer.height / layer.scale,
    );
  });
}
