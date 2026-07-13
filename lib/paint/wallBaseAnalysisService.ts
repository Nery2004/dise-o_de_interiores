import { applyMaskFeatherPass } from "@/lib/paint/MaskFeatherPass";
import { getSourceRaster } from "@/lib/paint/imageRaster";
import { PAINT_QUALITY_SCALE } from "@/lib/paint/paintSettings";
import {
  analyzeWallPixels,
  WHITE_BASE_ANALYSIS_VERSION,
  type WallColorAnalysis,
} from "@/lib/paint/wallColorAnalyzer";
import type { LoadedImage, WallMask, WhiteBaseSettings } from "@/types/editor";
import { LruCache } from "@/lib/cache/LruCache";

const analysisCache = new LruCache<string, WallColorAnalysis>({
  maxEntries: 32,
  maxEstimatedBytes: 2 * 1024 * 1024,
  estimateBytes: (analysis) => 512 + (analysis.luminanceHistogram.length + analysis.saturationHistogram.length + analysis.hueHistogram.length) * 8,
});

function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function createWallAnalysisKey(image: LoadedImage, mask: WallMask) {
  return `${WHITE_BASE_ANALYSIS_VERSION}:${stableHash(JSON.stringify({
    image: {
      dimensions: image.dimensions,
      name: image.name,
      size: image.size,
      type: image.type,
    },
    mask: {
      id: mask.id,
      path: mask.path,
      points: mask.points,
      refinement: mask.refinement,
      renderQuality: mask.renderQuality,
      whiteBaseMode: mask.whiteBaseSettings?.mode ?? "auto",
      manualWhiteBase:
        mask.whiteBaseSettings?.mode === "manual"
          ? {
              neutralizationStrength:
                mask.whiteBaseSettings.neutralizationStrength,
              saturationReduction: mask.whiteBaseSettings.saturationReduction,
              warmthCorrection: mask.whiteBaseSettings.warmthCorrection,
              baseBrightness: mask.whiteBaseSettings.baseBrightness,
              baseContrast: mask.whiteBaseSettings.baseContrast,
              shadowPreservation: mask.whiteBaseSettings.shadowPreservation,
              texturePreservation: mask.whiteBaseSettings.texturePreservation,
            }
          : undefined,
    },
  }))}`;
}

export function analysisToWhiteBaseSummary(
  analysis: WallColorAnalysis,
  analysisKey: string,
): Pick<
  WhiteBaseSettings,
  | "analysisKey"
  | "analysisVersion"
  | "analyzedAt"
  | "profile"
  | "averageColor"
  | "medianColor"
  | "averageLuminance"
  | "averageSaturation"
  | "dominantHue"
  | "darkPixelRatio"
  | "lightPixelRatio"
> {
  return {
    analysisKey,
    analysisVersion: analysis.analysisVersion,
    analyzedAt: new Date().toISOString(),
    profile: analysis.profile,
    averageColor: analysis.averageColor,
    medianColor: analysis.medianColor,
    averageLuminance: analysis.averageLuminance,
    averageSaturation: analysis.averageSaturation,
    dominantHue: analysis.dominantHue,
    darkPixelRatio: analysis.darkPixelRatio,
    lightPixelRatio: analysis.lightPixelRatio,
  };
}

export function whiteBaseSummaryToAnalysis(
  settings: WhiteBaseSettings | undefined,
): WallColorAnalysis | null {
  if (
    !settings?.profile ||
    !settings.averageColor ||
    !settings.medianColor ||
    settings.averageLuminance === undefined ||
    settings.averageSaturation === undefined
  ) {
    return null;
  }
  return {
    analysisVersion: settings.analysisVersion,
    averageColor: settings.averageColor,
    medianColor: settings.medianColor,
    averageLuminance: settings.averageLuminance,
    averageSaturation: settings.averageSaturation,
    dominantHue: settings.dominantHue,
    darkPixelRatio: settings.darkPixelRatio ?? 0,
    lightPixelRatio: settings.lightPixelRatio ?? 0,
    profile: settings.profile,
    sampleCount: 0,
    luminanceHistogram: [],
    saturationHistogram: [],
    hueHistogram: [],
  };
}

export async function analyzeWallBase(
  image: LoadedImage,
  mask: WallMask,
  options: { force?: boolean; signal?: AbortSignal; scaleOverride?: number } = {},
) {
  const analysisKey = createWallAnalysisKey(image, mask);
  if (!options.force) {
    const persisted =
      mask.whiteBaseSettings?.analysisKey === analysisKey
        ? whiteBaseSummaryToAnalysis(mask.whiteBaseSettings)
        : null;
    if (persisted) return { analysis: persisted, analysisKey };
    const cached = analysisCache.get(analysisKey);
    if (cached) return { analysis: cached, analysisKey };
  }
  const quality = mask.renderQuality ?? "high";
  const scale = Math.min(PAINT_QUALITY_SCALE[quality], options.scaleOverride ?? 1);
  const source = await getSourceRaster(image, scale);
  if (options.signal?.aborted) {
    throw new DOMException("Analysis cancelled", "AbortError");
  }
  const finalMask = applyMaskFeatherPass(mask, image.dimensions, scale, 0);
  if (!finalMask) throw new Error("Mask has no analyzable pixels.");
  const analysis = analyzeWallPixels({
    mask: finalMask,
    quality,
    signal: options.signal,
    source,
  });
  analysisCache.set(analysisKey, analysis);
  return { analysis, analysisKey };
}

export function clearWallAnalysisCache() {
  analysisCache.clear();
}

export function getWallAnalysisCacheStats() {
  return analysisCache.stats();
}
