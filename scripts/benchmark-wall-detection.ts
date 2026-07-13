import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { DEFAULT_WALL_DETECTION_EVALUATION_CONFIG, getMorphologyKernelSize } from "@/lib/wall-detection/evaluation/config";
import { evaluateStage, loadWallDetectionFixtures, polygonsForMasks, writeBenchmarkVisuals, type LoadedWallFixture, type StageEvaluation } from "@/scripts/wall-detection/benchmark-utils";
import { SegmentationPipeline } from "@/lib/wallDetection/pipeline/SegmentationPipeline";
import { morphMask, rasterizePolygon } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask, RefinementStageName, SegmentationProviderOutput } from "@/lib/wallDetection/pipeline/types";
import { WALL_DETECTION_PIPELINE_VERSION } from "@/lib/wallDetection/pipeline/version";

const FIXTURE_ROOT = path.join(process.cwd(), "tests/fixtures/wall-detection");
const REPORT_ROOT = path.join(process.cwd(), "reports");
const VISUAL_ROOT = path.join(REPORT_ROOT, "wall-detection-visuals");
const BASELINE_PATH = path.join(process.cwd(), "tests/baselines/wall-detection-baseline.json");
const args = new Set(process.argv.slice(2));
const requestedProvider = process.argv.find((argument) => argument.startsWith("--provider="))?.split("=")[1] ?? "recorded";
const benchmarkController = new AbortController();
process.once("SIGINT", () => benchmarkController.abort());
process.once("SIGTERM", () => benchmarkController.abort());

type ProviderMode = "recorded" | "mock" | "backend-mock" | "configured";
type CaseResult = {
  id: string;
  description: string;
  difficulty: string;
  tags: string[];
  provider: ProviderMode;
  providerVersion: string;
  expectedWalls: number;
  predictedWalls: number;
  timings: { totalMs: number; pipelineMs: number; stages: Record<string, number> };
  approximateMemoryBytes: number;
  stages: Record<string, StageEvaluation>;
  simplificationCurve: Array<{ tolerance: number; pointCount: number; iou: number; boundaryIou: number }>;
};

const round = (value: number, digits = 6) => Number(value.toFixed(digits));

function recordedProvider(fixture: LoadedWallFixture) {
  return {
    version: "recorded-synthetic-v1",
    async segmentWalls(): Promise<SegmentationProviderOutput> {
      const exclusionMasks = Object.values(fixture.exclusions);
      return {
        modelVersion: this.version,
        regions: fixture.recorded.map((mask, index) => ({
          id: `${fixture.metadata.id}-recorded-${index + 1}`,
          name: `Predicción ${index + 1}`,
          confidence: 0.82,
          mask: { ...mask, data: mask.data.slice() },
          exclusionMasks,
        })),
      };
    },
  };
}

function mockProvider(fixture: LoadedWallFixture, backend: boolean) {
  const definitions = [
    [[4, 10], [34, 5], [37, 49], [7, 57]],
    [[33, 5], [68, 6], [66, 47], [37, 49]],
    [[68, 6], [92, 12], [88, 56], [66, 47]],
  ];
  return {
    version: backend ? "backend-mock-synthetic-v2" : "mock-synthetic-v2",
    async segmentWalls(): Promise<SegmentationProviderOutput> {
      return {
        modelVersion: this.version,
        regions: definitions.map((points, index) => ({
          id: `mock-wall-${index + 1}`,
          confidence: 0.9 - index * 0.03,
          mask: rasterizePolygon(fixture.metadata.width, fixture.metadata.height, points.map(([x, y]) => ({ x, y }))),
        })),
      };
    },
  };
}

function providerFor(mode: ProviderMode, fixture: LoadedWallFixture) {
  if (mode === "recorded") return recordedProvider(fixture);
  if (mode === "mock" || mode === "backend-mock") return mockProvider(fixture, mode === "backend-mock");
  if (process.env.RUN_EXTERNAL_WALL_AI !== "true")
    throw new Error("El provider configurado requiere RUN_EXTERNAL_WALL_AI=true.");
  throw new Error("Los providers externos siguen siendo placeholders; no existe una llamada segura que ejecutar.");
}

function disabledStages(): Record<RefinementStageName, false> {
  return {
    edgeAlignment: false,
    perspectiveCorrection: false,
    gapFilling: false,
    holeRemoval: false,
    noiseRemoval: false,
    boundaryOptimization: false,
    cornerSnap: false,
    polygonOptimization: false,
  };
}

function throwIfBenchmarkCancelled() {
  if (benchmarkController.signal.aborted)
    throw new DOMException("Benchmark cancelado", "AbortError");
}

function stageMasks(result: Awaited<ReturnType<SegmentationPipeline["run"]>>, key: RefinementStageName) {
  return result.debugRegions?.map((region) => region.trace.stageMasks[key] ?? region.trace.final) ?? [];
}

async function runPipeline(
  fixture: LoadedWallFixture,
  mode: ProviderMode,
  stages?: Partial<Record<RefinementStageName, boolean>>,
) {
  throwIfBenchmarkCancelled();
  return new SegmentationPipeline().run(providerFor(mode, fixture), {
    imageBuffer: fixture.imageBuffer,
    mimeType: "image/webp",
    dimensions: { width: fixture.metadata.width, height: fixture.metadata.height },
    signal: benchmarkController.signal,
  }, { debug: true, refinement: stages ? { stages } : undefined });
}

async function benchmarkCase(fixture: LoadedWallFixture, mode: ProviderMode): Promise<CaseResult> {
  const started = performance.now();
  const [full, withoutRefinement] = await Promise.all([
    runPipeline(fixture, mode),
    runPipeline(fixture, mode, disabledStages()),
  ]);
  const finalMasks = full.debugRegions?.map((region) => region.mask) ?? [];
  const rawMasks = mode === "recorded"
    ? fixture.recorded
    : withoutRefinement.debugRegions?.map((region) => region.trace.original) ?? [];
  const finalPolygons = full.debugRegions?.map((region) => region.polygon) ?? [];
  const stages: Record<string, StageEvaluation> = {
    raw: evaluateStage(rawMasks, fixture.expected, fixture.exclusions),
    pipelineWithoutRefinement: evaluateStage(withoutRefinement.debugRegions?.map((region) => region.mask) ?? [], fixture.expected, fixture.exclusions),
    edgeAlignment: evaluateStage(stageMasks(full, "edgeAlignment"), fixture.expected, fixture.exclusions),
    cleanup: evaluateStage(full.debugRegions?.map((region) => region.trace.cleaned) ?? [], fixture.expected, fixture.exclusions),
    boundaryOptimization: evaluateStage(full.debugRegions?.map((region) => region.trace.corrected) ?? [], fixture.expected, fixture.exclusions),
    cornerSnap: evaluateStage(stageMasks(full, "cornerSnap"), fixture.expected, fixture.exclusions),
    final: evaluateStage(finalMasks, fixture.expected, fixture.exclusions, finalPolygons),
  };
  const simplificationCurve = [0.5, 1, 1.8, 3, 5].map((tolerance) => {
    const polygons = polygonsForMasks(finalMasks, tolerance);
    const masks = polygons.map((polygon, index) => rasterizePolygon(finalMasks[index].width, finalMasks[index].height, polygon));
    const evaluation = evaluateStage(masks, fixture.expected, fixture.exclusions, polygons);
    return { tolerance, pointCount: evaluation.polygon.pointCount, iou: evaluation.binary.intersectionOverUnion, boundaryIou: evaluation.boundary.boundaryIntersectionOverUnion };
  });
  const stageTimingEntries = full.debugRegions?.flatMap((region) => Object.entries(region.stageTimings)) ?? [];
  const timingByStage: Record<string, number> = {};
  for (const [name, duration] of stageTimingEntries) timingByStage[name] = (timingByStage[name] ?? 0) + (duration ?? 0);
  const traceBytes = full.debugRegions?.reduce((sum, region) => sum + region.mask.data.byteLength + Object.values(region.trace.stageMasks).reduce((stageSum, mask) => stageSum + (mask?.data.byteLength ?? 0), 0), 0) ?? 0;
  return {
    id: fixture.metadata.id,
    description: fixture.metadata.description,
    difficulty: fixture.metadata.difficulty,
    tags: fixture.metadata.tags,
    provider: mode,
    providerVersion: full.providerVersion,
    expectedWalls: fixture.metadata.expectedWalls,
    predictedWalls: finalMasks.length,
    timings: { totalMs: round(performance.now() - started, 3), pipelineMs: full.processingTimeMs, stages: Object.fromEntries(Object.entries(timingByStage).map(([key, value]) => [key, round(value, 3)])) },
    approximateMemoryBytes: fixture.imageBuffer.byteLength + rawMasks.reduce((sum, mask) => sum + mask.data.byteLength, 0) + traceBytes,
    stages,
    simplificationCurve,
  };
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))];
}

function summarize(cases: CaseResult[], stage = "final") {
  const evaluations = cases.map((item) => item.stages[stage]);
  const average = (read: (item: StageEvaluation) => number) => evaluations.length ? evaluations.reduce((sum, item) => sum + read(item), 0) / evaluations.length : 0;
  const times = cases.map((item) => item.timings.totalMs);
  return {
    cases: cases.length,
    meanIou: round(average((item) => item.binary.intersectionOverUnion)),
    meanDice: round(average((item) => item.binary.diceCoefficient)),
    meanPrecision: round(average((item) => item.binary.precision)),
    meanRecall: round(average((item) => item.binary.recall)),
    meanBoundaryIou: round(average((item) => item.boundary.boundaryIntersectionOverUnion)),
    meanBoundaryDistance: round(average((item) => item.boundary.meanBoundaryDistance)),
    meanExclusionLeakage: round(average((item) => item.exclusionLeakage)),
    meanFragmentationScore: round(average((item) => item.fragmentation.fragmentationScore)),
    meanPolygonComplexityScore: round(average((item) => item.polygon.polygonComplexityScore)),
    meanQualityScore: round(average((item) => item.qualityScore)),
    meanTimeMs: round(times.reduce((sum, value) => sum + value, 0) / Math.max(1, times.length), 3),
    p50TimeMs: round(percentile(times, 0.5), 3),
    p95TimeMs: round(percentile(times, 0.95), 3),
    maximumTimeMs: round(Math.max(0, ...times), 3),
  };
}

async function runAblations(fixtures: LoadedWallFixture[], mode: ProviderMode, fullSummary: ReturnType<typeof summarize>) {
  const names: RefinementStageName[] = ["edgeAlignment", "perspectiveCorrection", "gapFilling", "holeRemoval", "noiseRemoval", "boundaryOptimization", "cornerSnap", "polygonOptimization"];
  const results = [];
  for (const disabled of names) {
    throwIfBenchmarkCancelled();
    const cases: CaseResult[] = [];
    for (const fixture of fixtures) {
      throwIfBenchmarkCancelled();
      const result = await runPipeline(fixture, mode, { [disabled]: false });
      const masks = result.debugRegions?.map((region) => region.mask) ?? [];
      const evaluation = evaluateStage(masks, fixture.expected, fixture.exclusions, result.debugRegions?.map((region) => region.polygon) ?? []);
      cases.push({ id: fixture.metadata.id, description: fixture.metadata.description, difficulty: fixture.metadata.difficulty, tags: fixture.metadata.tags, provider: mode, providerVersion: result.providerVersion, expectedWalls: fixture.metadata.expectedWalls, predictedWalls: masks.length, timings: { totalMs: result.processingTimeMs, pipelineMs: result.processingTimeMs, stages: {} }, approximateMemoryBytes: 0, stages: { final: evaluation }, simplificationCurve: [] });
    }
    const summary = summarize(cases);
    results.push({ disabled, ...summary, deltaIou: round(summary.meanIou - fullSummary.meanIou), deltaBoundaryIou: round(summary.meanBoundaryIou - fullSummary.meanBoundaryIou), deltaLeakage: round(summary.meanExclusionLeakage - fullSummary.meanExclusionLeakage), deltaQuality: round(summary.meanQualityScore - fullSummary.meanQualityScore) });
  }
  return results;
}

function groupSummary(cases: CaseResult[], key: "difficulty" | "tags") {
  const groups = new Map<string, CaseResult[]>();
  for (const item of cases) {
    const values = key === "tags" ? item.tags : [item.difficulty];
    for (const value of values) groups.set(value, [...(groups.get(value) ?? []), item]);
  }
  return Object.fromEntries([...groups.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([name, items]) => [name, summarize(items)]));
}

function markdownReport(report: ReturnType<typeof createReport>) {
  const global = report.global;
  const rows = report.cases.map((item) => `| ${item.id} | ${item.difficulty} | ${item.stages.raw.binary.intersectionOverUnion.toFixed(3)} | ${item.stages.final.binary.intersectionOverUnion.toFixed(3)} | ${item.stages.final.boundary.boundaryIntersectionOverUnion.toFixed(3)} | ${(item.stages.final.exclusionLeakage * 100).toFixed(2)}% | ${item.stages.final.qualityScore.toFixed(1)} | ${item.timings.totalMs.toFixed(1)} | ${item.stages.final.errors.join(", ") || "—"} |`).join("\n");
  return `# Benchmark de detección de paredes\n\nPipeline ${report.pipelineVersion}; provider detallado: \`${report.provider}\`. Dataset sintético: estos números no representan precisión sobre fotografías reales.\n\n## Resumen global\n\n- IoU: ${global.meanIou.toFixed(4)}\n- Dice: ${global.meanDice.toFixed(4)}\n- Precision: ${global.meanPrecision.toFixed(4)}\n- Recall: ${global.meanRecall.toFixed(4)}\n- Boundary IoU (3 px): ${global.meanBoundaryIou.toFixed(4)}\n- Leakage de exclusiones: ${(global.meanExclusionLeakage * 100).toFixed(2)}%\n- Quality score medido: ${global.meanQualityScore.toFixed(2)}/100\n- Tiempo promedio/p50/p95/máximo: ${global.meanTimeMs.toFixed(1)} / ${global.p50TimeMs.toFixed(1)} / ${global.p95TimeMs.toFixed(1)} / ${global.maximumTimeMs.toFixed(1)} ms\n- Mejor caso: ${report.bestCase}\n- Peor caso: ${report.worstCase}\n\n## Resultado por caso\n\n| Caso | Dificultad | IoU crudo | IoU final | Boundary IoU | Leakage | Quality | Tiempo ms | Errores |\n|---|---|---:|---:|---:|---:|---:|---:|---|\n${rows}\n\n## Providers\n\n| Modo | Estado | IoU | Quality |\n|---|---|---:|---:|\n${Object.entries(report.providerComparison).map(([name, value]) => `| ${name} | ${value.status} | ${value.summary ? value.summary.meanIou.toFixed(4) : "—"} | ${value.summary ? value.summary.meanQualityScore.toFixed(2) : "—"} |`).join("\n")}\n\n## Threshold y morfología\n\nLas predicciones pregrabadas son binarias; por ello los thresholds 0.3–0.7 producen el mismo resultado y no justifican elegir 0.5 por mejora medida. La comparación morfológica está en el JSON.\n\n## Limitaciones\n\nEl dataset es geométrico, pequeño y sintético. Los providers externos son placeholders y no fueron llamados. Los tiempos corresponden a fixtures de 96×64 px y no validan por sí solos el objetivo de 1080p.\n`;
}

function ablationMarkdown(results: Awaited<ReturnType<typeof runAblations>>) {
  return `# Ablación del pipeline de paredes\n\nUn delta positivo al desactivar una etapa indica que esa etapa empeoró el promedio del dataset sintético. No implica generalización a fotografías.\n\n| Etapa desactivada | IoU | Δ IoU | Boundary IoU | Δ Boundary | Leakage | Δ Leakage | Quality | Δ Quality |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${results.map((item) => `| ${item.disabled} | ${item.meanIou.toFixed(4)} | ${item.deltaIou.toFixed(4)} | ${item.meanBoundaryIou.toFixed(4)} | ${item.deltaBoundaryIou.toFixed(4)} | ${(item.meanExclusionLeakage * 100).toFixed(2)}% | ${(item.deltaLeakage * 100).toFixed(2)}% | ${item.meanQualityScore.toFixed(2)} | ${item.deltaQuality.toFixed(2)} |`).join("\n")}\n`;
}

function createReport(cases: CaseResult[], provider: ProviderMode, providerComparison: Record<string, { status: string; summary: ReturnType<typeof summarize> | null }>, ablations: Awaited<ReturnType<typeof runAblations>>, morphology: Record<string, ReturnType<typeof summarize>>) {
  const sorted = [...cases].sort((first, second) => first.stages.final.qualityScore - second.stages.final.qualityScore || first.id.localeCompare(second.id));
  return {
    schemaVersion: 1,
    pipelineVersion: WALL_DETECTION_PIPELINE_VERSION,
    provider,
    configuration: DEFAULT_WALL_DETECTION_EVALUATION_CONFIG,
    dataset: { type: "synthetic", cases: cases.length, fixtureRoot: "tests/fixtures/wall-detection" },
    global: summarize(cases),
    rawGlobal: summarize(cases, "raw"),
    byDifficulty: groupSummary(cases, "difficulty"),
    byProblemType: groupSummary(cases, "tags"),
    bestCase: sorted.at(-1)?.id ?? null,
    worstCase: sorted[0]?.id ?? null,
    providerComparison,
    thresholdTuning: [0.3, 0.4, 0.5, 0.6, 0.7].map((threshold) => ({ threshold, sourceMaskIsBinary: true, summary: summarize(cases, "raw") })),
    morphology,
    ablations,
    cases,
  };
}

async function compareBaseline(report: ReturnType<typeof createReport>) {
  const baseline = JSON.parse(await readFile(BASELINE_PATH, "utf8")) as ReturnType<typeof createReport>;
  const tolerance = DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.regression;
  const errors: string[] = [];
  if (report.global.meanIou < baseline.global.meanIou - tolerance.maximumIouDrop) errors.push(`IoU global cayó ${round(baseline.global.meanIou - report.global.meanIou)}`);
  if (report.global.meanExclusionLeakage > baseline.global.meanExclusionLeakage + tolerance.maximumLeakageIncrease) errors.push("Leakage global aumentó demasiado");
  if (report.global.meanQualityScore < baseline.global.meanQualityScore - tolerance.maximumQualityDrop) errors.push("Quality score global empeoró");
  if (report.global.meanTimeMs > baseline.global.meanTimeMs * (1 + tolerance.maximumRuntimeIncreaseRatio) + 5) errors.push("Tiempo promedio aumentó demasiado");
  const baselineCases = new Map(baseline.cases.map((item) => [item.id, item]));
  const criticalTags = new Set(["opening", "occlusion", "window", "door"]);
  for (const item of report.cases.filter((candidate) => candidate.difficulty === "hard" || candidate.tags.some((tag) => criticalTags.has(tag)))) {
    const previous = baselineCases.get(item.id);
    if (previous && item.stages.final.binary.intersectionOverUnion < previous.stages.final.binary.intersectionOverUnion - tolerance.maximumIouDrop)
      errors.push(`Regresión en caso crítico ${item.id}`);
  }
  if (errors.length) throw new Error(`Regression gate de paredes:\n- ${errors.join("\n- ")}`);
}

async function main() {
  if (!["recorded", "mock", "backend-mock", "configured"].includes(requestedProvider)) throw new Error(`Provider de benchmark no válido: ${requestedProvider}`);
  const provider = requestedProvider as ProviderMode;
  const fixtures = await loadWallDetectionFixtures(FIXTURE_ROOT);
  await mkdir(REPORT_ROOT, { recursive: true });
  await rm(VISUAL_ROOT, { recursive: true, force: true });
  const cases: CaseResult[] = [];
  for (const fixture of fixtures) {
    throwIfBenchmarkCancelled();
    const result = await benchmarkCase(fixture, provider);
    cases.push(result);
    const full = await runPipeline(fixture, provider);
    await writeBenchmarkVisuals(VISUAL_ROOT, fixture, full.debugRegions?.map((region) => region.mask) ?? []);
  }
  const fullSummary = summarize(cases);
  const ablations = await runAblations(fixtures, provider, fullSummary);
  const providerComparison: Record<string, { status: string; summary: ReturnType<typeof summarize> | null }> = {};
  for (const mode of ["recorded", "mock", "backend-mock"] as const) {
    throwIfBenchmarkCancelled();
    const modeCases = mode === provider ? cases : await Promise.all(fixtures.map((fixture) => benchmarkCase(fixture, mode)));
    providerComparison[mode] = { status: mode === "recorded" ? "salida pregrabada" : "mock sintético; no detecta la imagen", summary: summarize(modeCases) };
  }
  providerComparison.configured = { status: "no ejecutado: providers externos placeholder", summary: null };
  providerComparison.withoutRefinement = { status: "pipeline sin etapas", summary: summarize(cases, "pipelineWithoutRefinement") };
  providerComparison.withRefinement = { status: "pipeline completo", summary: fullSummary };

  const morphologyCases: Record<string, CaseResult[]> = { none: [] , closing: [], opening: [], relativeCloseOpen: [] };
  for (const fixture of fixtures) {
    throwIfBenchmarkCancelled();
    const radius = getMorphologyKernelSize(fixture.metadata.width, fixture.metadata.height);
    const variants: Record<string, BinaryMask[]> = {
      none: fixture.recorded,
      closing: fixture.recorded.map((mask) => morphMask(morphMask(mask, 1, "dilate"), 1, "erode")),
      opening: fixture.recorded.map((mask) => morphMask(morphMask(mask, 1, "erode"), 1, "dilate")),
      relativeCloseOpen: fixture.recorded.map((mask) => {
        const closed = morphMask(morphMask(mask, radius, "dilate"), radius, "erode");
        return morphMask(morphMask(closed, Math.max(1, radius - 1), "erode"), Math.max(1, radius - 1), "dilate");
      }),
    };
    for (const [name, masks] of Object.entries(variants)) {
      morphologyCases[name].push({ id: fixture.metadata.id, description: fixture.metadata.description, difficulty: fixture.metadata.difficulty, tags: fixture.metadata.tags, provider, providerVersion: "morphology-evaluation", expectedWalls: fixture.metadata.expectedWalls, predictedWalls: masks.length, timings: { totalMs: 0, pipelineMs: 0, stages: {} }, approximateMemoryBytes: 0, stages: { final: evaluateStage(masks, fixture.expected, fixture.exclusions) }, simplificationCurve: [] });
    }
  }
  const morphology = Object.fromEntries(Object.entries(morphologyCases).map(([name, items]) => [name, summarize(items)]));
  const report = createReport(cases, provider, providerComparison, ablations, morphology);
  await writeFile(path.join(REPORT_ROOT, "wall-detection-benchmark.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(REPORT_ROOT, "wall-detection-benchmark.md"), markdownReport(report));
  await writeFile(path.join(REPORT_ROOT, "wall-detection-ablation.md"), ablationMarkdown(ablations));
  if (args.has("--write-baseline")) {
    await mkdir(path.dirname(BASELINE_PATH), { recursive: true });
    await writeFile(BASELINE_PATH, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (args.has("--check")) await compareBaseline(report);
  process.stdout.write(`Benchmark paredes: ${report.global.meanIou.toFixed(4)} IoU · ${report.global.meanQualityScore.toFixed(2)} quality · ${cases.length} casos\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
