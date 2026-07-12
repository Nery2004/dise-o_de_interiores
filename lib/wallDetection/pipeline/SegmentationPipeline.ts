import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import { countMaskPixels } from "@/lib/wallDetection/pipeline/MaskOperations";
import { ImageEdgeAnalyzer } from "@/lib/wallDetection/pipeline/ImageEdgeAnalyzer";
import { PerspectiveAnalyzer } from "@/lib/wallDetection/pipeline/PerspectiveAnalyzer";
import { resolveRefinementSettings } from "@/lib/wallDetection/pipeline/RefinementSettings";
import { WallRefinementPipeline } from "@/lib/wallDetection/pipeline/WallRefinementPipeline";
import { ContourExtractor } from "@/lib/wallDetection/pipeline/ContourExtractor";
import { PolygonOptimizer } from "@/lib/wallDetection/pipeline/PolygonOptimizer";
import type { PipelineConfig, SegmentationPipelineResult, SegmentationProviderInput, SegmentationProviderOutput } from "@/lib/wallDetection/pipeline/types";

const defaults: PipelineConfig = {
  maskSmoothness: 0.45,
  polygonTolerance: 1.8,
  minimumRegionAreaRatio: 0.002,
  debug: false,
  refinement: {},
};

export function processingDimensions(width: number, height: number, maximumDimension = 512) {
  const scale = Math.min(1, maximumDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export class SegmentationPipeline {
  private imageEdges = new ImageEdgeAnalyzer();
  private perspective = new PerspectiveAnalyzer();
  private refinement = new WallRefinementPipeline();
  private contours = new ContourExtractor();
  private polygons = new PolygonOptimizer();

  async run(
    provider: { segmentWalls(input: SegmentationProviderInput): Promise<SegmentationProviderOutput> },
    input: Omit<SegmentationProviderInput, "processingDimensions">,
    config: Partial<PipelineConfig> = {},
  ): Promise<SegmentationPipelineResult> {
    const startedAt = performance.now();
    const options = { ...defaults, ...config, refinement: { ...defaults.refinement, ...config.refinement } };
    const dimensions = processingDimensions(input.dimensions.width, input.dimensions.height);
    const [output, edgeMap] = await Promise.all([
      provider.segmentWalls({ ...input, processingDimensions: dimensions }),
      this.imageEdges.analyze(input.imageBuffer, dimensions.width, dimensions.height),
    ]);
    if (input.signal.aborted) throw new DOMException("Detección cancelada", "AbortError");
    const lines = this.perspective.analyze(edgeMap);
    const settings = resolveRefinementSettings({
      ...options.refinement,
      polygonTolerance: options.refinement.polygonTolerance ?? options.polygonTolerance,
      featherStrength: options.refinement.featherStrength ?? options.maskSmoothness,
    });
    const walls = [];
    const debugRegions = [];
    let wallNumber = 0;
    for (const region of output.regions) {
      if (input.signal.aborted) throw new DOMException("Detección cancelada", "AbortError");
      if (countMaskPixels(region.mask) < Math.max(8, region.mask.data.length * options.minimumRegionAreaRatio)) continue;
      const result = this.refinement.run(region.mask, {
        edgeMap,
        lines,
        exclusions: region.exclusionMasks ?? [],
        providerConfidence: region.confidence,
      }, settings);
      if (result.polygon.length < 3) continue;
      const scaleX = input.dimensions.width / result.mask.width;
      const scaleY = input.dimensions.height / result.mask.height;
      const scale = (points: WallDetectionPoint[]) => points.map((point) => ({
        x: Math.max(0, Math.min(input.dimensions.width, point.x * scaleX)),
        y: Math.max(0, Math.min(input.dimensions.height, point.y * scaleY)),
      }));
      wallNumber += 1;
      const id = region.id || `wall-${wallNumber}`;
      walls.push({
        id,
        name: region.name ?? `Pared ${wallNumber}`,
        confidence: region.confidence,
        qualityScore: result.qualityScore,
        points: scale(result.polygon),
        exclusionPolygons: (region.exclusionMasks ?? []).flatMap((exclusion) => {
          if (exclusion.width !== result.mask.width || exclusion.height !== result.mask.height) return [];
          const contour = this.contours.extract(exclusion);
          const polygon = contour.length >= 3 ? this.polygons.optimize(contour, settings.polygonTolerance) : [];
          return polygon.length >= 3 ? [scale(polygon)] : [];
        }),
        refinement: {
          appliedStages: result.appliedStages,
          refinementCount: result.appliedStages.length,
          pointCount: result.polygon.length,
          retryCount: result.retryCount,
          issues: result.issues,
          stageTimings: result.stageTimings,
        },
      });
      if (options.debug) debugRegions.push({
        id,
        mask: result.mask,
        contour: result.contour,
        polygon: result.polygon,
        refined: result.polygon,
        confidence: region.confidence,
        qualityScore: result.qualityScore,
        qualityBreakdown: result.qualityBreakdown,
        issues: result.issues,
        trace: result.trace,
        stageTimings: result.stageTimings,
        appliedStages: result.appliedStages,
        retryCount: result.retryCount,
      });
    }
    const averageQualityScore = walls.length ? walls.reduce((sum, wall) => sum + wall.qualityScore, 0) / walls.length : 0;
    return {
      walls,
      providerVersion: output.modelVersion,
      processingTimeMs: Math.round(performance.now() - startedAt),
      averageQualityScore: Math.round(averageQualityScore * 10) / 10,
      debugRegions: options.debug ? debugRegions : undefined,
    };
  }
}
