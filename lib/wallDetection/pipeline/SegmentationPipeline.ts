import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import { BinaryMaskProcessor } from "@/lib/wallDetection/pipeline/BinaryMaskProcessor";
import { ContourExtractor } from "@/lib/wallDetection/pipeline/ContourExtractor";
import { MaskQualityAnalyzer } from "@/lib/wallDetection/pipeline/MaskQualityAnalyzer";
import { PolygonSimplifier } from "@/lib/wallDetection/pipeline/PolygonSimplifier";
import { WallRefiner } from "@/lib/wallDetection/pipeline/WallRefiner";
import type { PipelineConfig, SegmentationPipelineResult, SegmentationProviderInput, SegmentationProviderOutput } from "@/lib/wallDetection/pipeline/types";

const defaults: PipelineConfig = { maskSmoothness: 0.45, polygonTolerance: 1.8, minimumRegionAreaRatio: 0.002, debug: false };

export function processingDimensions(width: number, height: number, maximumDimension = 512) {
  const scale = Math.min(1, maximumDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export class SegmentationPipeline {
  private masks = new BinaryMaskProcessor();
  private contours = new ContourExtractor();
  private polygons = new PolygonSimplifier();
  private refiner = new WallRefiner();
  private quality = new MaskQualityAnalyzer();

  async run(
    provider: { segmentWalls(input: SegmentationProviderInput): Promise<SegmentationProviderOutput> },
    input: Omit<SegmentationProviderInput, "processingDimensions">,
    config: Partial<PipelineConfig> = {},
  ): Promise<SegmentationPipelineResult> {
    const startedAt = performance.now();
    const options = { ...defaults, ...config };
    const dimensions = processingDimensions(input.dimensions.width, input.dimensions.height);
    const output = await provider.segmentWalls({ ...input, processingDimensions: dimensions });
    if (input.signal.aborted) throw new DOMException("Detección cancelada", "AbortError");
    const walls = [];
    const debugRegions = [];
    let wallNumber = 0;
    for (const region of output.regions) {
      const cleaned = this.masks.process(region.mask, options.maskSmoothness, region.exclusionMasks);
      const minimumArea = Math.max(8, Math.round(cleaned.width * cleaned.height * options.minimumRegionAreaRatio));
      for (const component of this.masks.connectedComponents(cleaned, minimumArea)) {
        if (input.signal.aborted) throw new DOMException("Detección cancelada", "AbortError");
        const contour = this.contours.extract(component);
        if (contour.length < 3) continue;
        const polygon = this.polygons.simplify(contour, options.polygonTolerance);
        const refined = this.refiner.refine(polygon, component.width, component.height);
        if (refined.length < 3) continue;
        const qualityScore = this.quality.analyze(component, refined, region.confidence);
        const scaleX = input.dimensions.width / component.width;
        const scaleY = input.dimensions.height / component.height;
        const scale = (points: WallDetectionPoint[]) => points.map((point) => ({ x: Math.min(input.dimensions.width, point.x * scaleX), y: Math.min(input.dimensions.height, point.y * scaleY) }));
        wallNumber += 1;
        const id = `${region.id}-${wallNumber}`;
        walls.push({ id, name: region.name ?? `Pared ${wallNumber}`, confidence: region.confidence, qualityScore, points: scale(refined) });
        if (options.debug) debugRegions.push({ id, mask: component, contour, polygon, refined, confidence: region.confidence, qualityScore });
      }
    }
    const averageQualityScore = walls.length ? walls.reduce((sum, wall) => sum + wall.qualityScore, 0) / walls.length : 0;
    return { walls, providerVersion: output.modelVersion, processingTimeMs: Math.round(performance.now() - startedAt), averageQualityScore, debugRegions: options.debug ? debugRegions : undefined };
  }
}
