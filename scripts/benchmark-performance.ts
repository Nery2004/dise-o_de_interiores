import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { performance } from "node:perf_hooks";
import { PaintRenderPipeline, type PaintRenderInput } from "@/lib/paint/PaintRenderPipeline";
import { DEFAULT_WHITE_BASE_SETTINGS, resolveEffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import { clampObjectToImage } from "@/lib/decor/objectPlacementGeometry";
import { getSmartGuides } from "@/lib/decor/alignmentSystem";
import { clampTranslation, getComparisonClipPath } from "@/lib/canvas/canvasTransformUtils";
import { shouldAddBrushPoint } from "@/lib/geometry/brushGeometry";
import { lightingDefaults } from "@/lib/lighting/lightProfile";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { getOptimalPreviewResolution } from "@/lib/performance/previewResolution";
import { hexToRgbColor, rgbToOklab } from "@/lib/colors/colorSpace";

const REPORT_JSON = path.join(process.cwd(), "reports/editor-performance.json");
const REPORT_MD = path.join(process.cwd(), "reports/editor-performance.md");
const BASELINE = path.join(process.cwd(), "tests/baselines/performance-baseline.json");
const args = new Set(process.argv.slice(2));
const round = (value: number) => Number(value.toFixed(3));

function percentile(values: number[], amount: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * amount))] ?? 0;
}

function distribution(values: number[]) {
  return {
    calls: values.length,
    averageMs: round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)),
    maximumMs: round(Math.max(0, ...values)),
    p50Ms: round(percentile(values, 0.5)),
    p95Ms: round(percentile(values, 0.95)),
  };
}

function measured<T>(operation: () => T) {
  const started = performance.now();
  const result = operation();
  return { result, duration: performance.now() - started };
}

function paintInput(width: number, height: number): PaintRenderInput {
  const pixels = width * height;
  const original = new Uint8ClampedArray(pixels * 4);
  const mask = new Uint8ClampedArray(pixels).fill(255);
  for (let index = 0; index < pixels; index += 1) {
    const x = index % width;
    const gradient = 150 + Math.round((x / Math.max(1, width - 1)) * 70);
    original[index * 4] = gradient;
    original[index * 4 + 1] = gradient - 10;
    original[index * 4 + 2] = gradient - 25;
    original[index * 4 + 3] = 255;
  }
  const neutralizationSettings = resolveEffectiveWhiteBaseSettings(DEFAULT_WHITE_BASE_SETTINGS, null, 100);
  return {
    originalImage: { data: original, width, height },
    mask: { alpha: mask, width, height },
    targetColor: "#A8B5A2",
    paintMode: "white-base",
    paintIntensity: 100,
    primerCoverage: 100,
    neutralizationSettings,
    shadowPreservation: 90,
    texturePreservation: 90,
    edgeFeather: 4,
    blendMode: "paint-simulation",
    quality: "high",
  };
}

function placed(index: number): PlacedDecorObject {
  return {
    id: `object-${index}`, decorObjectId: "asset", name: "Objeto", assetUrl: "/decor/chairs/light-wood-chair.webp", assetType: "webp",
    originalWidth: 800, originalHeight: 800, x: 80 + (index % 10) * 140, y: 80 + Math.floor(index / 10) * 140,
    width: 120, height: 120, scaleX: 0.15, scaleY: 0.15, rotation: 0, opacity: 1, visible: true, locked: false,
    selected: index === 0, zIndex: index, flipX: false, flipY: false, lockAspectRatio: true, surfaceType: "free", anchor: "center",
    depth: 0.5, perspectiveMode: "none", autoScaleByDepth: false, baseContactOffset: 0, zOrderMode: "manual",
    ...lightingDefaults("sillas", "free"), tags: [], relativeScale: "medium", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function totalBytes(directory: string, extension: string): Promise<{ files: number; bytes: number }> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return totalBytes(target, extension);
      if (!entry.name.endsWith(extension)) return { files: 0, bytes: 0 };
      return { files: 1, bytes: (await stat(target)).size };
    }));
    return nested.reduce((sum, item) => ({ files: sum.files + item.files, bytes: sum.bytes + item.bytes }), { files: 0, bytes: 0 });
  } catch {
    return { files: 0, bytes: 0 };
  }
}

async function routeClientBytes(route: string) {
  const manifest = path.join(
    process.cwd(),
    ".next/server/app",
    route === "page" ? "page_client-reference-manifest.js" : `${route}/page_client-reference-manifest.js`,
  );
  try {
    const contents = await readFile(manifest, "utf8");
    const chunks = [...new Set(contents.match(/static\/chunks\/[^\"]+\.js/g) ?? [])];
    const sizes = await Promise.all(chunks.map(async (chunk) => {
      try { return (await stat(path.join(process.cwd(), ".next", chunk))).size; } catch { return 0; }
    }));
    return { chunks: chunks.length, bytes: sizes.reduce((sum, value) => sum + value, 0) };
  } catch {
    return { chunks: 0, bytes: 0 };
  }
}

function interactionBenchmarks() {
  const objects = Array.from({ length: 50 }, (_, index) => placed(index));
  const drag: number[] = [];
  const mask: number[] = [];
  const zoom: number[] = [];
  const comparator: number[] = [];
  const brush: number[] = [];
  const slider: number[] = [];
  const colorChange: number[] = [];
  let previous = { x: 0, y: 0 };
  for (let frame = 0; frame < 600; frame += 1) {
    const moving = { ...objects[0], x: 100 + frame * 2, y: 120 + frame };
    drag.push(measured(() => {
      const clamped = clampObjectToImage(moving, { width: 3840, height: 2160 });
      return getSmartGuides(clamped, objects);
    }).duration);
    mask.push(measured(() => Array.from({ length: 20 }, (_, maskIndex) => ({ id: maskIndex, points: Array.from({ length: 24 }, (_, point) => ({ x: point + frame, y: point * 2 })) }))).duration);
    zoom.push(measured(() => clampTranslation({ scale: 0.5 + frame / 1000, translateX: frame, translateY: -frame }, { width: 1440, height: 900 }, { width: 6000, height: 4000 })).duration);
    comparator.push(measured(() => getComparisonClipPath(frame % 2 ? "vertical" : "horizontal", frame % 101)).duration);
    slider.push(measured(() => Math.min(200, Math.max(0, (frame * 7) % 240))).duration);
    colorChange.push(measured(() => rgbToOklab(hexToRgbColor(["#A8B5A2", "#A7BED3", "#C98276", "#C8C1B5"][frame % 4]))).duration);
    const next = { x: frame * 2, y: frame };
    brush.push(measured(() => shouldAddBrushPoint(previous, next, 40)).duration);
    previous = next;
  }
  return { objectDrag: distribution(drag), maskEditing: distribution(mask), zoomPan: distribution(zoom), slider: distribution(slider), comparator: distribution(comparator), brush: distribution(brush), colorChange: distribution(colorChange) };
}

function markdown(report: Awaited<ReturnType<typeof benchmark>>) {
  return `# Rendimiento del editor\n\nMedición ${report.generatedAt}. Entorno Node ${process.version}; los FPS son proxies CPU y no sustituyen un navegador real.\n\n## Pipeline\n\n- Pintura 1080p p50/p95: ${report.pipeline.paint1080.p50Ms} / ${report.pipeline.paint1080.p95Ms} ms\n- Exportación PNG 1080p p50/p95: ${report.pipeline.export1080.p50Ms} / ${report.pipeline.export1080.p95Ms} ms\n- Memoria estimada preview 6000×4000 automático: ${(report.memory.previewLargeImageBytes / 1048576).toFixed(1)} MiB (${report.memory.previewResolution.width}×${report.memory.previewResolution.height})\n- Historial sintético: ${(report.memory.historyBytes / 1048576).toFixed(2)} MiB\n\n## Interacción CPU\n\n| Ruta | p50 ms | p95 ms | máximo ms |\n|---|---:|---:|---:|\n${Object.entries(report.interactions).map(([name, item]) => `| ${name} | ${item.p50Ms} | ${item.p95Ms} | ${item.maximumMs} |`).join("\n")}\n\n## Bundle\n\n- Landing: ${(report.bundle.landing.bytes / 1024).toFixed(1)} KiB (${report.bundle.landing.chunks} chunks)\n- Editor: ${(report.bundle.editor.bytes / 1024).toFixed(1)} KiB (${report.bundle.editor.chunks} chunks)\n- JS estático total: ${(report.bundle.staticJs.bytes / 1024).toFixed(1)} KiB\n\nLos tiempos varían por CPU, carga y JIT. Lighthouse/Core Web Vitals requieren Chrome real y se registran por separado.\n`;
}

async function benchmark() {
  const pipeline = new PaintRenderPipeline();
  pipeline.render(paintInput(320, 180));
  const paintDurations: number[] = [];
  const exportDurations: number[] = [];
  for (let run = 0; run < 3; run += 1) {
    const input = paintInput(1920, 1080);
    const paint = measured(() => pipeline.render(input));
    paintDurations.push(paint.duration);
    const encodingStarted = performance.now();
    await sharp(paint.result.imageData, { raw: { width: 1920, height: 1080, channels: 4 } }).png({ compressionLevel: 6 }).toBuffer();
    exportDurations.push(performance.now() - encodingStarted + paint.duration);
  }
  const interactions = interactionBenchmarks();
  const historySample = Array.from({ length: 100 }, (_, revision) => ({ revision, masks: Array.from({ length: 20 }, (_, maskIndex) => ({ id: `mask-${maskIndex}`, color: "#A8B5A2", points: Array.from({ length: 24 }, (_, point) => ({ x: point * 17, y: point * 11 })) })) }));
  const previewResolution = getOptimalPreviewResolution({
    image: { width: 6000, height: 4000 },
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 2,
    deviceMemoryGb: 4,
    mobile: false,
    quality: "high",
    mode: "automatic",
  });
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    pipeline: { paint1080: distribution(paintDurations), export1080: distribution(exportDurations) },
    interactions,
    memory: {
      previewLargeImageBytes: Math.round(previewResolution.width * previewResolution.height * 26),
      previewResolution,
      historyBytes: Buffer.byteLength(JSON.stringify(historySample)),
      stressSceneBytes: Buffer.byteLength(JSON.stringify({ objects: Array.from({ length: 50 }, (_, index) => placed(index)), proposals: Array.from({ length: 10 }, (_, index) => ({ id: index, masks: historySample[index].masks, objects: Array.from({ length: 50 }, (_, object) => placed(object)) })) })),
    },
    bundle: {
      landing: await routeClientBytes("page"),
      editor: await routeClientBytes("editor"),
      staticJs: await totalBytes(path.join(process.cwd(), ".next/static/chunks"), ".js"),
    },
    inventory: { canvasCreationSites: 24, workerTypes: 3, clientComponents: 91, layerCacheEntries: 24, sourceRasterEntries: 4, analysisEntries: 32, decorRenderBytes: 96 * 1024 * 1024 },
  };
}

async function check(report: Awaited<ReturnType<typeof benchmark>>) {
  const baseline = JSON.parse(await readFile(BASELINE, "utf8")) as typeof report;
  const failures: string[] = [];
  const regression = (current: number, previous: number, tolerance: number, label: string) => {
    if (previous > 0 && current > previous * tolerance) failures.push(`${label}: ${current} > ${round(previous * tolerance)}`);
  };
  regression(report.pipeline.paint1080.p50Ms, baseline.pipeline.paint1080.p50Ms, 1.25, "pintura 1080p");
  regression(report.pipeline.export1080.p50Ms, baseline.pipeline.export1080.p50Ms, 1.3, "exportación 1080p");
  regression(report.memory.previewLargeImageBytes, baseline.memory.previewLargeImageBytes, 1.1, "memoria preview");
  regression(report.bundle.landing.bytes, baseline.bundle.landing.bytes, 1.15, "bundle landing");
  regression(report.bundle.editor.bytes, baseline.bundle.editor.bytes, 1.15, "bundle editor");
  if (failures.length) throw new Error(`Regresiones de rendimiento:\n- ${failures.join("\n- ")}`);
}

async function main() {
  const report = await benchmark();
  await mkdir(path.dirname(REPORT_JSON), { recursive: true });
  await writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(REPORT_MD, markdown(report));
  if (args.has("--write-baseline")) {
    await mkdir(path.dirname(BASELINE), { recursive: true });
    await writeFile(BASELINE, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (args.has("--check")) await check(report);
  process.stdout.write(`Performance: pintura ${report.pipeline.paint1080.p50Ms} ms · export ${report.pipeline.export1080.p50Ms} ms · landing ${(report.bundle.landing.bytes / 1024).toFixed(1)} KiB\n`);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
