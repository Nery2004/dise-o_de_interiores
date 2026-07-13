import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PaintRenderPipeline, type PaintRenderInput } from "@/lib/paint/PaintRenderPipeline";
import { DEFAULT_WHITE_BASE_SETTINGS, resolveEffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import { trimHistoryByEstimatedBytes } from "@/lib/history/historyBudget";
import { LruCache } from "@/lib/cache/LruCache";
import { getOptimalPreviewResolution } from "@/lib/performance/previewResolution";

function memory() {
  const usage = process.memoryUsage();
  return { heapUsed: usage.heapUsed, external: usage.external, arrayBuffers: usage.arrayBuffers, rss: usage.rss };
}

function collectGarbage() {
  (globalThis as typeof globalThis & { gc?: () => void }).gc?.();
}

function input(width: number, height: number, color: string): PaintRenderInput {
  const pixels = width * height;
  const original = new Uint8ClampedArray(pixels * 4);
  const alpha = new Uint8ClampedArray(pixels).fill(255);
  for (let index = 0; index < pixels; index += 1) {
    original[index * 4] = 182;
    original[index * 4 + 1] = 165;
    original[index * 4 + 2] = 144;
    original[index * 4 + 3] = 255;
  }
  return {
    originalImage: { data: original, width, height }, mask: { alpha, width, height }, targetColor: color,
    paintMode: "white-base", paintIntensity: 100, primerCoverage: 100,
    neutralizationSettings: resolveEffectiveWhiteBaseSettings(DEFAULT_WHITE_BASE_SETTINGS, null, 100),
    shadowPreservation: 90, texturePreservation: 90, edgeFeather: 4, blendMode: "paint-simulation", quality: "high",
  };
}

async function main() {
  collectGarbage();
  const before = memory();
  const pipeline = new PaintRenderPipeline();
  const durations: number[] = [];
  const colors = ["#A8B5A2", "#A7BED3", "#C98276", "#C8C1B5", "#8FA18C"];
  for (const color of colors) {
    const started = performance.now();
    const rendered = pipeline.render(input(1280, 720, color));
    await sharp(rendered.imageData, { raw: { width: rendered.width, height: rendered.height, channels: 4 } }).png().toBuffer();
    durations.push(performance.now() - started);
  }

  let history: Array<{ revision: number; masks: unknown[] }> = [];
  for (let revision = 0; revision < 1_000; revision += 1) {
    const masks = Array.from({ length: 20 }, (_, id) => ({ id, color: colors[(revision + id) % colors.length], points: Array.from({ length: 40 }, (__, point) => ({ x: point * 11, y: point * 7 })) }));
    history = trimHistoryByEstimatedBytes([...history, { revision, masks }], 100, 12 * 1024 * 1024);
  }
  const objects = Array.from({ length: 50 }, (_, id) => ({ id, x: id * 13, y: id * 7, width: 240, height: 180, rotation: id % 12, visible: true }));
  const proposals = Array.from({ length: 10 }, (_, id) => ({ id, masks: history[id]?.masks ?? [], objects }));
  const stressSceneBytes = Buffer.byteLength(JSON.stringify({ objects, proposals }));

  const cache = new LruCache<number, Uint8ClampedArray>({ maxEntries: 24, maxEstimatedBytes: 16 * 1024 * 1024, estimateBytes: (value) => value.byteLength });
  for (let index = 0; index < 250; index += 1) cache.set(index, new Uint8ClampedArray(512 * 512));
  const peak = memory();
  const preview4k = getOptimalPreviewResolution({ image: { width: 3840, height: 2160 }, viewport: { width: 1440, height: 900 }, devicePixelRatio: 2, deviceMemoryGb: 4, quality: "high" });
  const report = {
    generatedAt: new Date().toISOString(),
    scenarios: { masks: 20, objects: 50, proposals: 10, rapidColorChangesAndExports: colors.length, requestedHistoryRevisions: 1_000 },
    repeatedPaintAndPngMs: durations,
    retainedHistoryRevisions: history.length,
    stressSceneBytes,
    boundedCache: cache.stats(),
    preview4k,
    processMemoryBefore: before,
    processMemoryPeak: peak,
    processMemoryAfterCleanup: {} as ReturnType<typeof memory>,
    note: "process.memoryUsage incluye Node y buffers internos de Sharp; el criterio estable adicional es que historial y LRU permanezcan dentro de sus presupuestos.",
  };
  cache.clear();
  history = [];
  collectGarbage();
  report.processMemoryAfterCleanup = memory();
  await mkdir(path.join(process.cwd(), "reports"), { recursive: true });
  await writeFile(path.join(process.cwd(), "reports/editor-stress.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`Estrés: ${report.retainedHistoryRevisions} revisiones retenidas · caché ${(report.boundedCache.estimatedBytes / 1048576).toFixed(1)} MiB · ${durations.length} renders/exportaciones\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
