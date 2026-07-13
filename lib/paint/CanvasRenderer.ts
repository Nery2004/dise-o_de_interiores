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
import { renderPaint } from "@/lib/paint/paintWorkerClient";
import { PAINT_PIPELINE_VERSION } from "@/lib/paint/pipelineVersion";
import { getOptimalPreviewResolution } from "@/lib/performance/previewResolution";
import type { ImageDimensions } from "@/types/editor";
import { LruCache } from "@/lib/cache/LruCache";

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
  previewViewport?: ImageDimensions;
  signal?: AbortSignal;
};

type CachedMaskLayer = {
  promise: Promise<RenderedMaskLayer | null>;
  signal?: AbortSignal;
};

const layerCache = new LruCache<string, CachedMaskLayer>({
  maxEntries: 24,
  maxEstimatedBytes: 128 * 1024 * 1024,
});

function maskCacheKey(
  image: LoadedImage,
  mask: WallMask,
  globalBlendMode: BlendMode,
  whiteBasePreviewOnly: boolean,
  qualityOverride?: RenderQuality,
  scaleOverride?: number,
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
    scaleOverride,
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
  scaleOverride?: number,
  signal?: AbortSignal,
): Promise<RenderedMaskLayer | null> {
  if (signal?.aborted) throw new DOMException("Render cancelado", "AbortError");
  if (!mask.color && !whiteBasePreviewOnly) return null;
  const resolvedSettings = resolvePaintSettings(mask, globalBlendMode);
  const settings = qualityOverride
    ? { ...resolvedSettings, renderQuality: qualityOverride }
    : resolvedSettings;
  const scale = Math.min(
    PAINT_QUALITY_SCALE[settings.renderQuality],
    scaleOverride ?? 1,
  );
  const source = await getSourceRaster(image, scale);
  if (signal?.aborted) throw new DOMException("Render cancelado", "AbortError");
  const featheredMask = applyMaskFeatherPass(
    mask,
    image.dimensions,
    scale,
    settings.edgeFeather,
  );
  if (!featheredMask) return null;
  const analysisResult =
    settings.paintMode === "white-base"
      ? await analyzeWallBase(image, mask, { scaleOverride: scale, signal })
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
  const rendered = await renderPaint({
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
    signal,
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
  scaleOverride?: number,
  signal?: AbortSignal,
) {
  const key = maskCacheKey(
    image,
    mask,
    globalBlendMode,
    whiteBasePreviewOnly,
    qualityOverride,
    scaleOverride,
  );
  const cached = layerCache.get(key);
  if (cached && !cached.signal?.aborted) return cached.promise;
  if (cached) layerCache.delete(key);
  const pending = renderMaskLayer(
    image,
    mask,
    globalBlendMode,
    whiteBasePreviewOnly,
    qualityOverride,
    scaleOverride,
    signal,
  );
  const estimatedScale = Math.min(
    PAINT_QUALITY_SCALE[qualityOverride ?? resolvePaintSettings(mask, globalBlendMode).renderQuality],
    scaleOverride ?? 1,
  );
  layerCache.set(
    key,
    { promise: pending, signal },
    Math.round(image.dimensions.width * image.dimensions.height * estimatedScale * estimatedScale * 4),
  );
  pending.catch(() => {
    const current = layerCache.get(key);
    if (current?.promise === pending) layerCache.delete(key);
  });
  return pending;
}

export function getPaintLayerCacheStats() {
  return layerCache.stats();
}

export function clearPaintLayerCache() {
  layerCache.clear();
}

export async function renderPaintScene({
  canvas,
  globalBlendMode,
  image,
  includeOriginal,
  masks,
  whiteBasePreviewMaskId,
  qualityOverride,
  previewViewport,
  signal,
}: RenderPaintSceneOptions) {
  if (signal?.aborted) throw new DOMException("Render cancelado", "AbortError");
  const requestedQualities = masks.filter((mask) => mask.visible).map((mask) => qualityOverride ?? mask.renderQuality ?? "high");
  const previewMode = requestedQualities.includes("ultra")
    ? "quality"
    : requestedQualities.length > 0 && requestedQualities.every((quality) => quality === "draft")
      ? "performance"
      : "automatic";
  const canScalePreview = Boolean(previewViewport);
  const preview = canScalePreview
    ? getOptimalPreviewResolution({
        image: image.dimensions,
        viewport: previewViewport!,
        devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
        deviceMemoryGb: typeof navigator === "undefined" ? 4 : (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4,
        mobile: typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches,
        quality: previewMode === "performance" ? "draft" : "high",
        mode: previewMode,
      })
    : { scale: 1, width: image.dimensions.width, height: image.dimensions.height };
  const outputScale = preview.scale;
  canvas.width = preview.width;
  canvas.height = preview.height;
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
      0,
      0,
      canvas.width,
      canvas.height,
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
        outputScale,
        signal,
      ),
    ),
  );
  if (signal?.aborted) throw new DOMException("Render cancelado", "AbortError");
  layers.forEach((layer) => {
    if (!layer) return;
    const layerToOutput = outputScale / layer.scale;
    context.drawImage(
      layer.canvas,
      0,
      0,
      layer.width,
      layer.height,
      layer.x * layerToOutput,
      layer.y * layerToOutput,
      layer.width * layerToOutput,
      layer.height * layerToOutput,
    );
  });
}
