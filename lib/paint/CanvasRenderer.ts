import { maskHasExportableColor } from "@/lib/mask-geometry";
import { applyMaskFeatherPass } from "@/lib/paint/MaskFeatherPass";
import {
  PAINT_QUALITY_SCALE,
  resolvePaintSettings,
} from "@/lib/paint/paintSettings";
import {
  createRenderCanvas,
  getRenderContext,
  type RenderCanvas,
} from "@/lib/paint/renderCanvas";
import {
  getSourceRaster,
  loadPaintImage,
} from "@/lib/paint/imageRaster";
import { analyzeWallBase } from "@/lib/paint/wallBaseAnalysisService";
import { resolveEffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import type { BlendMode, LoadedImage, RenderQuality, WallMask } from "@/types/editor";
import { PaintRenderPipeline } from "@/lib/paint/PaintRenderPipeline";
import { PAINT_PIPELINE_VERSION } from "@/lib/paint/pipelineVersion";

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
  qualityOverride?: RenderQuality;
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
  qualityOverride?: RenderQuality,
) {
  return `${PAINT_PIPELINE_VERSION}:${image.url}:${JSON.stringify({
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
    qualityOverride,
    whiteBasePreviewOnly,
    whiteBaseSettings: mask.whiteBaseSettings,
  })}`;
}

async function renderMaskLayer(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
  whiteBasePreviewOnly: boolean,
  qualityOverride?: RenderQuality,
): Promise<RenderedMaskLayer | null> {
  if (!mask.color && !whiteBasePreviewOnly) return null;
  const resolvedSettings = resolvePaintSettings(mask, globalBlendMode);
  const settings = qualityOverride
    ? { ...resolvedSettings, renderQuality: qualityOverride }
    : resolvedSettings;
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
  const cropSource = new Uint8ClampedArray(pixelCount * 4);
  const cropAlpha = new Uint8ClampedArray(pixelCount);
  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const sourceX = bounds.x + x;
      const sourceY = bounds.y + y;
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const cropIndex = y * bounds.width + x;
      cropSource.set(source.data.subarray(sourceIndex, sourceIndex + 4), cropIndex * 4);
      cropAlpha[cropIndex] = alpha[sourceY * source.width + sourceX];
    }
  }
  const averageLuminance =
    analysisResult?.analysis.averageLuminance;
  const layerCanvas = createRenderCanvas(bounds.width, bounds.height);
  const layerContext = getRenderContext(layerCanvas);
  const output = layerContext.createImageData(bounds.width, bounds.height);
  const rendered = new PaintRenderPipeline().render({
    originalImage: { data: cropSource, width: bounds.width, height: bounds.height },
    mask: { alpha: cropAlpha, width: bounds.width, height: bounds.height },
    targetColor: mask.color ?? "#FFFFFF",
    paintMode: settings.paintMode,
    paintIntensity: settings.paintIntensity,
    primerCoverage: settings.primerCoverage,
    neutralizationSettings: whiteBaseSettings,
    shadowPreservation: whiteBaseSettings.shadowPreservation,
    texturePreservation: whiteBaseSettings.texturePreservation,
    edgeFeather: settings.edgeFeather,
    blendMode: settings.blendMode,
    quality: settings.renderQuality,
    averageLuminance,
    whiteBasePreviewOnly,
  });
  output.data.set(rendered.imageData);
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
  qualityOverride?: RenderQuality,
) {
  const key = maskCacheKey(
    image,
    mask,
    globalBlendMode,
    whiteBasePreviewOnly,
    qualityOverride,
  );
  const cached = layerCache.get(key);
  if (cached) return cached;
  const pending = renderMaskLayer(
    image,
    mask,
    globalBlendMode,
    whiteBasePreviewOnly,
    qualityOverride,
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
  qualityOverride,
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
        qualityOverride,
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
