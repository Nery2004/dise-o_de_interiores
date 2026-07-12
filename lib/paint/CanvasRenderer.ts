import { maskHasExportableColor } from "@/lib/mask-geometry";
import { applyMaskFeatherPass } from "@/lib/paint/MaskFeatherPass";
import { processPaintPixel } from "@/lib/paint/PaintPipeline";
import {
  hexToRgbColor,
  rgbToOklab,
} from "@/lib/colors/colorSpace";
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
import {
  getSourceRaster,
  loadPaintImage,
  readRasterRgb,
} from "@/lib/paint/imageRaster";
import { analyzeWallBase } from "@/lib/paint/wallBaseAnalysisService";
import { resolveEffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";

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
  whiteBasePreviewMaskId?: string | null;
};

const layerCache = new Map<string, Promise<RenderedMaskLayer | null>>();

function rememberLimited<K, V>(cache: Map<K, V>, key: K, value: V, limit: number) {
  cache.set(key, value);
  if (cache.size <= limit) return value;
  const oldestKey = cache.keys().next().value;
  if (oldestKey !== undefined) cache.delete(oldestKey);
  return value;
}

function maskCacheKey(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
  whiteBasePreviewOnly: boolean,
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
    whiteBasePreviewOnly,
    whiteBaseSettings: mask.whiteBaseSettings,
  })}`;
}

async function renderMaskLayer(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
  whiteBasePreviewOnly: boolean,
): Promise<RenderedMaskLayer | null> {
  if (!mask.color && !whiteBasePreviewOnly) return null;
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
  const analysisResult =
    settings.paintMode === "white-base"
      ? await analyzeWallBase(image, mask)
      : null;
  const whiteBaseSettings = resolveEffectiveWhiteBaseSettings(
    mask.whiteBaseSettings,
    analysisResult?.analysis ?? null,
    settings.primerCoverage,
  );

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
      const value = rgbToOklab(readRasterRgb(source.data, sourceIndex)).l;
      const weight = alpha[sourceY * source.width + sourceX] / 255;
      luminance[cropIndex] = value;
      weightedLuminance += value * weight;
      totalWeight += weight;
    }
  }

  const sampledAverageLuminance =
    totalWeight > 0 ? weightedLuminance / totalWeight : 0.7;
  const averageLuminance =
    analysisResult?.analysis.averageLuminance ?? sampledAverageLuminance;
  const blurRadius = settings.renderQuality === "draft" ? 1 : settings.renderQuality === "high" ? 2 : 3;
  const localLuminance = createLocalLuminanceField(
    luminance,
    bounds.width,
    bounds.height,
    blurRadius,
  );
  const target = hexToRgbColor(mask.color ?? "#FFFFFF");
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
        source: readRasterRgb(source.data, sourceIndex),
        target,
        whiteBasePreviewOnly,
        whiteBaseSettings,
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
  whiteBasePreviewOnly: boolean,
) {
  const key = maskCacheKey(
    image,
    mask,
    globalBlendMode,
    whiteBasePreviewOnly,
  );
  const cached = layerCache.get(key);
  if (cached) return cached;
  const pending = renderMaskLayer(
    image,
    mask,
    globalBlendMode,
    whiteBasePreviewOnly,
  );
  return rememberLimited(layerCache, key, pending, 24);
}

export async function renderPaintScene({
  canvas,
  globalBlendMode,
  image,
  includeOriginal,
  masks,
  whiteBasePreviewMaskId,
}: RenderPaintSceneOptions) {
  canvas.width = image.dimensions.width;
  canvas.height = image.dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;

  if (includeOriginal) {
    context.drawImage(
      await loadPaintImage(image),
      0,
      0,
      image.dimensions.width,
      image.dimensions.height,
    );
  }

  const visibleMasks = masks.filter(
    (mask) =>
      maskHasExportableColor(mask) ||
      (mask.visible && mask.id === whiteBasePreviewMaskId),
  );
  const layers = await Promise.all(
    visibleMasks.map((mask) =>
      getRenderedMaskLayer(
        image,
        mask,
        globalBlendMode,
        mask.id === whiteBasePreviewMaskId,
      ),
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
