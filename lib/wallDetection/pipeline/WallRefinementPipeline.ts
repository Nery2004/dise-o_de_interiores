import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import { applyExclusions, cloneMask, normalizeMask, rasterizePolygon } from "@/lib/wallDetection/pipeline/MaskOperations";
import { EdgeAligner } from "@/lib/wallDetection/pipeline/EdgeAligner";
import { PerspectiveCorrector } from "@/lib/wallDetection/pipeline/PerspectiveCorrector";
import { GapFiller } from "@/lib/wallDetection/pipeline/GapFiller";
import { HoleRemover } from "@/lib/wallDetection/pipeline/HoleRemover";
import { NoiseCleaner } from "@/lib/wallDetection/pipeline/NoiseCleaner";
import { WallBoundaryOptimizer } from "@/lib/wallDetection/pipeline/WallBoundaryOptimizer";
import { ContourExtractor } from "@/lib/wallDetection/pipeline/ContourExtractor";
import { CornerSnapper } from "@/lib/wallDetection/pipeline/CornerSnapper";
import { PolygonOptimizer } from "@/lib/wallDetection/pipeline/PolygonOptimizer";
import { MaskValidator } from "@/lib/wallDetection/pipeline/MaskValidator";
import { MaskQualityAnalyzer } from "@/lib/wallDetection/pipeline/MaskQualityAnalyzer";
import { conservativeRefinementSettings, type RefinementSettings } from "@/lib/wallDetection/pipeline/RefinementSettings";
import type { ArchitectureLine, BinaryMask, EdgeMap, MaskQualityBreakdown, MaskValidationIssue, RefinementStageName, RefinementTrace } from "@/lib/wallDetection/pipeline/types";

export type WallRefinementResult = {
  mask: BinaryMask;
  contour: WallDetectionPoint[];
  polygon: WallDetectionPoint[];
  qualityScore: number;
  qualityBreakdown: MaskQualityBreakdown;
  issues: MaskValidationIssue[];
  stageTimings: Partial<Record<RefinementStageName, number>>;
  appliedStages: RefinementStageName[];
  trace: RefinementTrace;
  retryCount: number;
};

type RunContext = {
  edgeMap: EdgeMap | null;
  lines: ArchitectureLine[];
  exclusions: BinaryMask[];
  providerConfidence: number;
};

export class WallRefinementPipeline {
  private edgeAligner = new EdgeAligner();
  private perspective = new PerspectiveCorrector();
  private gaps = new GapFiller();
  private holes = new HoleRemover();
  private noise = new NoiseCleaner();
  private boundary = new WallBoundaryOptimizer();
  private contours = new ContourExtractor();
  private corners = new CornerSnapper();
  private polygons = new PolygonOptimizer();
  private validator = new MaskValidator();
  private quality = new MaskQualityAnalyzer();

  run(mask: BinaryMask, context: RunContext, settings: RefinementSettings): WallRefinementResult {
    const first = this.runPass(mask, context, settings, 0);
    if (first.qualityScore >= settings.qualityThreshold) return first;
    const retry = this.runPass(mask, context, conservativeRefinementSettings(settings), 1);
    return retry.qualityScore > first.qualityScore ? retry : { ...first, retryCount: 1 };
  }

  private runPass(mask: BinaryMask, context: RunContext, settings: RefinementSettings, retryCount: number): WallRefinementResult {
    const original = normalizeMask(mask);
    let current = applyExclusions(original, context.exclusions);
    const timings: Partial<Record<RefinementStageName, number>> = {};
    const applied: RefinementStageName[] = [];
    const stageMasks: Partial<Record<RefinementStageName, BinaryMask>> = {};
    const runMaskStage = (name: RefinementStageName, enabled: boolean, operation: (source: BinaryMask) => BinaryMask) => {
      if (!enabled) return;
      const started = performance.now();
      current = applyExclusions(operation(current), context.exclusions);
      timings[name] = Math.round((performance.now() - started) * 10) / 10;
      applied.push(name);
      stageMasks[name] = cloneMask(current);
    };

    runMaskStage("edgeAlignment", settings.stages.edgeAlignment && Boolean(context.edgeMap) && context.exclusions.length > 0, (source) =>
      this.edgeAligner.align(source, context.edgeMap, settings.edgeTolerance, settings.maxBoundaryDisplacement));
    runMaskStage("perspectiveCorrection", settings.stages.perspectiveCorrection && context.lines.length > 0, (source) =>
      this.perspective.correct(source, context.lines, settings.edgeTolerance, settings.maxBoundaryDisplacement, context.exclusions));
    runMaskStage("gapFilling", settings.stages.gapFilling, (source) => this.gaps.fill(source));
    runMaskStage("holeRemoval", settings.stages.holeRemoval, (source) => this.holes.remove(source, settings.holeThreshold, context.exclusions));
    runMaskStage("noiseRemoval", settings.stages.noiseRemoval, (source) => this.noise.clean(source, settings.noiseThreshold));
    const cleaned = cloneMask(current);
    runMaskStage("boundaryOptimization", settings.stages.boundaryOptimization, (source) => this.boundary.optimize(source, context.edgeMap, settings.featherStrength));
    const corrected = cloneMask(current);

    const contour = this.contours.extract(current);
    let polygon = contour;
    if (settings.stages.cornerSnap && polygon.length >= 3) {
      const started = performance.now();
      polygon = this.corners.snap(polygon, context.lines, mask.width, mask.height, settings.cornerSnapDistance);
      timings.cornerSnap = Math.round((performance.now() - started) * 10) / 10;
      applied.push("cornerSnap");
      stageMasks.cornerSnap = applyExclusions(
        rasterizePolygon(mask.width, mask.height, polygon),
        context.exclusions,
      );
    }
    if (settings.stages.polygonOptimization && polygon.length >= 3) {
      const started = performance.now();
      polygon = this.polygons.optimize(polygon, settings.polygonTolerance);
      timings.polygonOptimization = Math.round((performance.now() - started) * 10) / 10;
      applied.push("polygonOptimization");
      stageMasks.polygonOptimization = applyExclusions(
        rasterizePolygon(mask.width, mask.height, polygon),
        context.exclusions,
      );
    }
    const finalMask = polygon.length >= 3 ? applyExclusions(rasterizePolygon(mask.width, mask.height, polygon), context.exclusions) : cloneMask(current);
    const issues = this.validator.analyze(finalMask, polygon, original, context.exclusions);
    const quality = this.quality.analyze(finalMask, polygon, context.providerConfidence, context.edgeMap, issues);
    return {
      mask: finalMask,
      contour,
      polygon,
      qualityScore: quality.score,
      qualityBreakdown: quality.breakdown,
      issues,
      stageTimings: timings,
      appliedStages: applied,
      trace: { original, cleaned, corrected, final: finalMask, stageMasks },
      retryCount,
    };
  }
}
