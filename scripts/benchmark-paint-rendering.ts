import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { buildPaintInput, evaluatePaintFixture, loadPaintFixtures, type LoadedPaintFixture } from "@/scripts/paint-rendering/benchmark-utils";
import { PAINT_PIPELINE_VERSION } from "@/lib/paint/pipelineVersion";
import { PaintRenderPipeline } from "@/lib/paint/PaintRenderPipeline";
import { PAINT_QUALITY_SCALE } from "@/lib/paint/paintSettings";
import type { RenderQuality } from "@/types/editor";

const ROOT = path.join(process.cwd(), "tests/fixtures/paint-rendering");
const REPORTS = path.join(process.cwd(), "reports");
const VISUALS = path.join(REPORTS, "paint-rendering-visuals");
const BASELINE = path.join(process.cwd(), "tests/baselines/paint-rendering/paint-rendering-baseline.json");
const args = new Set(process.argv.slice(2));
const round = (value: number) => Number(value.toFixed(6));
const BLEND_MODES = ["normal", "multiply", "color", "overlay", "soft-light", "hard-light", "paint-simulation"] as const;

type CaseResult = ReturnType<typeof caseResult>;

function caseResult(id: string, description: string, targetColor: string, evaluation: ReturnType<typeof evaluatePaintFixture>) {
  return {
    id, description, targetColor,
    timeMs: round(evaluation.preview.timings.totalMs + evaluation.exported.timings.totalMs),
    approximateMemoryBytes: evaluation.approximateMemoryBytes,
    color: Object.fromEntries(Object.entries(evaluation.metrics.color).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
    luminance: Object.fromEntries(Object.entries(evaluation.metrics.luminance).map(([key, value]) => [key, round(value)])),
    texture: Object.fromEntries(Object.entries(evaluation.metrics.texture).map(([key, value]) => [key, round(value)])),
    shadows: Object.fromEntries(Object.entries(evaluation.metrics.shadows).map(([key, value]) => [key, round(value)])),
    previewExport: Object.fromEntries(Object.entries(evaluation.metrics.previewExport).map(([key, value]) => [key, round(value)])),
    feather: Object.fromEntries(Object.entries(evaluation.metrics.feather).map(([key, value]) => [key, round(value)])),
    clipping: {
      preview: evaluation.preview.diagnostics?.clippedChannelCount ?? 0,
      export: evaluation.exported.diagnostics?.clippedChannelCount ?? 0,
    },
    qualityModes: {
      draftMs: round(evaluation.draft.timings.totalMs),
      highMs: round(evaluation.preview.timings.totalMs),
      ultraMs: round(evaluation.exported.timings.totalMs),
      draftUltraDeltaE: round(evaluation.metrics.draftExport.meanDeltaE),
      highUltraDeltaE: round(evaluation.metrics.previewExport.meanDeltaE),
    },
  };
}

function summarize(cases: CaseResult[]) {
  const average = (read: (item: CaseResult) => number) => cases.reduce((sum, item) => sum + read(item), 0) / Math.max(1, cases.length);
  return {
    cases: cases.length,
    meanMidtoneDeltaE: round(average((item) => Number(item.color.midtoneColorError))),
    meanHueError: round(average((item) => Number(item.color.hueErrorDegrees))),
    meanLuminanceScore: round(average((item) => Number(item.luminance.score))),
    meanTextureScore: round(average((item) => Number(item.texture.score))),
    meanShadowScore: round(average((item) => Number(item.shadows.score))),
    meanPreviewExportDeltaE: round(average((item) => Number(item.previewExport.meanDeltaE))),
    meanDraftExportDeltaE: round(average((item) => item.qualityModes.draftUltraDeltaE)),
    meanDraftMs: round(average((item) => item.qualityModes.draftMs)),
    meanHighMs: round(average((item) => item.qualityModes.highMs)),
    meanUltraMs: round(average((item) => item.qualityModes.ultraMs)),
    meanTimeMs: round(average((item) => item.timeMs)),
    maximumTimeMs: round(Math.max(0, ...cases.map((item) => item.timeMs))),
    totalApproximateMemoryBytes: cases.reduce((sum, item) => sum + item.approximateMemoryBytes, 0),
    clippedChannels: cases.reduce((sum, item) => sum + item.clipping.export, 0),
  };
}

function evaluateControls(fixtures: Awaited<ReturnType<typeof loadPaintFixtures>>) {
  const wall = fixtures.find((fixture) => fixture.metadata.id === "beige-wall") ?? fixtures[0];
  const featherFixture = fixtures.find((fixture) => fixture.metadata.id === "feather-mask") ?? wall;
  const metric = (evaluation: ReturnType<typeof evaluatePaintFixture>) => ({
    midtoneDeltaE: round(evaluation.metrics.color.midtoneColorError),
    luminanceScore: round(evaluation.metrics.luminance.score),
    textureScore: round(evaluation.metrics.texture.score),
  });
  return {
    intensity: [0, 50, 100, 150, 200].map((value) => ({ value, ...metric(evaluatePaintFixture(wall, { paintIntensity: value })) })),
    primer: [0, 50, 100].map((value) => ({ value, ...metric(evaluatePaintFixture(wall, { primerCoverage: value })) })),
    feather: [0, 5, 10, 20, 40].map((value) => {
      const evaluation = evaluatePaintFixture(featherFixture, { edgeFeather: value });
      return { value, ...Object.fromEntries(Object.entries(evaluation.metrics.feather).map(([key, item]) => [key, round(item)])) };
    }),
    blendModes: BLEND_MODES.map((value) => ({ value, ...metric(evaluatePaintFixture(wall, { blendMode: value })) })),
  };
}

async function resizeFixture(fixture: LoadedPaintFixture, width: number, height: number): Promise<LoadedPaintFixture> {
  const original = await sharp(Buffer.from(fixture.original), { raw: { width: fixture.metadata.width, height: fixture.metadata.height, channels: 4 } }).resize(width, height).raw().toBuffer();
  const binaryMask = await sharp(Buffer.from(fixture.binaryMask), { raw: { width: fixture.metadata.width, height: fixture.metadata.height, channels: 1 } }).resize(width, height, { kernel: "nearest" }).raw().toBuffer({ resolveWithObject: true });
  return {
    directory: fixture.directory,
    metadata: { ...fixture.metadata, width, height, settings: { ...fixture.metadata.settings, edgeFeather: 4 } },
    original: new Uint8ClampedArray(original),
    binaryMask: Uint8ClampedArray.from({ length: width * height }, (_, index) => binaryMask.data[index * binaryMask.info.channels]),
  };
}

async function benchmark1080p(fixtures: Awaited<ReturnType<typeof loadPaintFixtures>>) {
  const source = fixtures.find((fixture) => fixture.metadata.id === "light-gradient") ?? fixtures[0];
  const modes: RenderQuality[] = ["draft", "high", "ultra"];
  const results = [];
  for (const quality of modes) {
    const scale = PAINT_QUALITY_SCALE[quality];
    const fixture = await resizeFixture(source, Math.round(1920 * scale), Math.round(1080 * scale));
    const rendered = new PaintRenderPipeline().render(buildPaintInput(fixture, quality));
    const pixels = fixture.metadata.width * fixture.metadata.height;
    results.push({
      quality,
      width: fixture.metadata.width,
      height: fixture.metadata.height,
      timeMs: round(rendered.timings.totalMs),
      approximateMemoryBytes: pixels * 22,
    });
  }
  return results;
}

function markdown(report: { pipelineVersion: string; global: ReturnType<typeof summarize>; cases: CaseResult[]; controls: ReturnType<typeof evaluateControls>; performance1080p: Awaited<ReturnType<typeof benchmark1080p>> }) {
  return `# Benchmark del motor de pintura\n\nPipeline ${report.pipelineVersion}. Dataset sintético; no representa pintura física.\n\n## Resumen\n\n- ΔE medio en midtones: ${report.global.meanMidtoneDeltaE.toFixed(2)}\n- Error medio de matiz: ${report.global.meanHueError.toFixed(2)}°\n- Preservación de luminancia: ${report.global.meanLuminanceScore.toFixed(2)}/100\n- Preservación de textura: ${report.global.meanTextureScore.toFixed(2)}/100\n- Estructura de sombras: ${report.global.meanShadowScore.toFixed(2)}/100\n- Diferencia Borrador/Ultra: ΔE ${report.global.meanDraftExportDeltaE.toFixed(3)}\n- Diferencia preview Alta/export Ultra: ΔE ${report.global.meanPreviewExportDeltaE.toFixed(3)}\n- Tiempo Borrador/Alta/Ultra en fixtures 96×64: ${report.global.meanDraftMs.toFixed(2)} / ${report.global.meanHighMs.toFixed(2)} / ${report.global.meanUltraMs.toFixed(2)} ms\n- Tiempo combinado Alta+Ultra medio/máximo: ${report.global.meanTimeMs.toFixed(2)} / ${report.global.maximumTimeMs.toFixed(2)} ms\n- Canales recortados: ${report.global.clippedChannels}\n\n| Caso | Target | ΔE midtone | Hue ° | Luminancia | Textura | Sombras | Preview/export ΔE | Tiempo ms |\n|---|---|---:|---:|---:|---:|---:|---:|---:|\n${report.cases.map((item) => `| ${item.id} | ${item.targetColor} | ${Number(item.color.midtoneColorError).toFixed(2)} | ${Number(item.color.hueErrorDegrees).toFixed(2)} | ${Number(item.luminance.score).toFixed(1)} | ${Number(item.texture.score).toFixed(1)} | ${Number(item.shadows.score).toFixed(1)} | ${Number(item.previewExport.meanDeltaE).toFixed(3)} | ${item.timeMs.toFixed(2)} |`).join("\n")}\n\n## Rendimiento 1080p\n\n${report.performance1080p.map((item) => `- ${item.quality}: ${item.width}×${item.height}, ${item.timeMs.toFixed(1)} ms, ${(item.approximateMemoryBytes / 1048576).toFixed(1)} MiB aproximados`).join("\n")}\n\n## Controles\n\nIntensidad (valor → ΔE): ${report.controls.intensity.map((item) => `${item.value} → ${item.midtoneDeltaE.toFixed(2)}`).join(", ")}.\n\nImprimación (valor → ΔE): ${report.controls.primer.map((item) => `${item.value} → ${item.midtoneDeltaE.toFixed(2)}`).join(", ")}.\n\nLos valores dependen de fixtures controlados, no de iluminación, pantalla, cámara, acabado o superficie reales.\n`;
}

async function check(report: { global: ReturnType<typeof summarize>; cases: CaseResult[] }) {
  const baseline = JSON.parse(await readFile(BASELINE, "utf8")) as typeof report;
  const failures: string[] = [];
  if (report.global.meanMidtoneDeltaE > baseline.global.meanMidtoneDeltaE + 1) failures.push("aumentó el error cromático");
  if (report.global.meanTextureScore < baseline.global.meanTextureScore - 5) failures.push("cayó la textura");
  if (report.global.meanShadowScore < baseline.global.meanShadowScore - 5) failures.push("cayeron las sombras");
  if (report.global.meanPreviewExportDeltaE > baseline.global.meanPreviewExportDeltaE + 0.5) failures.push("preview y exportación divergen");
  if (report.global.meanTimeMs > baseline.global.meanTimeMs * 1.25 + 5) failures.push("empeoró el rendimiento");
  const previous = new Map(baseline.cases.map((item) => [item.id, item]));
  for (const item of report.cases) {
    const before = previous.get(item.id);
    if (before && Number(item.color.midtoneColorError) > Number(before.color.midtoneColorError) + 2) failures.push(`regresión cromática en ${item.id}`);
  }
  if (failures.length) throw new Error(`Regression gate de pintura:\n- ${failures.join("\n- ")}`);
}

async function main() {
  const fixtures = await loadPaintFixtures(ROOT);
  await mkdir(REPORTS, { recursive: true });
  await rm(VISUALS, { recursive: true, force: true });
  await mkdir(VISUALS, { recursive: true });
  const cases: CaseResult[] = [];
  for (const fixture of fixtures) {
    const evaluation = evaluatePaintFixture(fixture);
    cases.push(caseResult(fixture.metadata.id, fixture.metadata.description, fixture.metadata.targetColor, evaluation));
    await sharp(evaluation.exportComposite, { raw: { width: fixture.metadata.width, height: fixture.metadata.height, channels: 4 } }).png().toFile(path.join(VISUALS, `${fixture.metadata.id}.png`));
  }
  const report = { schemaVersion: 2, pipelineVersion: PAINT_PIPELINE_VERSION, dataset: { type: "synthetic", cases: cases.length }, global: summarize(cases), controls: evaluateControls(fixtures), performance1080p: await benchmark1080p(fixtures), cases };
  await writeFile(path.join(REPORTS, "paint-rendering-benchmark.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(REPORTS, "paint-rendering-benchmark.md"), markdown(report));
  if (args.has("--write-baseline")) { await mkdir(path.dirname(BASELINE), { recursive: true }); await writeFile(BASELINE, `${JSON.stringify(report, null, 2)}\n`); }
  if (args.has("--check")) await check(report);
  process.stdout.write(`Benchmark pintura: ΔE ${report.global.meanMidtoneDeltaE.toFixed(2)} · luminancia ${report.global.meanLuminanceScore.toFixed(1)} · ${cases.length} casos\n`);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
