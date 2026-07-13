import assert from "node:assert/strict";
import test from "node:test";
import { LruCache } from "@/lib/cache/LruCache";
import { MemoryTracker } from "@/lib/performance/MemoryTracker";
import { PipelineTimer } from "@/lib/performance/PipelineTimer";
import { getOptimalPreviewResolution } from "@/lib/performance/previewResolution";
import { estimateSerializableBytes, trimHistoryByEstimatedBytes } from "@/lib/history/historyBudget";
import { estimateExportMemory, validateExportDimensions } from "@/lib/exportImage";
import { ObjectUrlManager } from "@/lib/images/ObjectUrlManager";

test("LRU limita entradas y bytes, actualiza recencia y ejecuta dispose", () => {
  const disposed: string[] = [];
  const cache = new LruCache<string, string>({ maxEntries: 3, maxEstimatedBytes: 10, estimateBytes: (value) => value.length, dispose: (_value, key) => disposed.push(key) });
  cache.set("a", "1234"); cache.set("b", "1234"); cache.get("a"); cache.set("c", "1234");
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("a"), "1234");
  assert.equal(cache.stats().estimatedBytes, 8);
  cache.clear();
  assert.deepEqual(disposed, ["b", "c", "a"]);
});

test("resolución automática limita 6000×4000 según viewport, DPR y memoria", () => {
  const constrained = getOptimalPreviewResolution({ image: { width: 6000, height: 4000 }, viewport: { width: 1200, height: 800 }, devicePixelRatio: 4, deviceMemoryGb: 2, mobile: true, quality: "high" });
  const quality = getOptimalPreviewResolution({ image: { width: 6000, height: 4000 }, viewport: { width: 2400, height: 1600 }, devicePixelRatio: 2, deviceMemoryGb: 8, quality: "high", mode: "quality" });
  assert.ok(constrained.width < quality.width);
  assert.ok(constrained.dpr <= 1.25);
  assert.ok(constrained.width * constrained.height <= constrained.pixelBudget * 1.01);
  assert.equal(getOptimalPreviewResolution({ image: { width: 640, height: 480 }, quality: "ultra" }).scale, 1);
});

test("MemoryTracker reemplaza recursos sin doble conteo", () => {
  const tracker = new MemoryTracker();
  tracker.set("canvas", 100); tracker.set("mask", 50); tracker.set("canvas", 80);
  assert.deepEqual(tracker.snapshot(), { entries: 2, estimatedBytes: 130, resources: { canvas: 80, mask: 50 } });
  tracker.delete("mask");
  assert.equal(tracker.snapshot().estimatedBytes, 80);
});

test("PipelineTimer registra etapas y total no negativos", () => {
  const timer = new PipelineTimer();
  timer.stage("prepare"); timer.stage("paint");
  const result = timer.finish();
  assert.deepEqual(Object.keys(result.stages), ["prepare", "paint"]);
  assert.ok(result.totalMs >= 0);
});

test("el historial conserva las revisiones más nuevas dentro del presupuesto", () => {
  const history = ["a".repeat(10), "b".repeat(10), "c".repeat(10), "d".repeat(10)];
  const entryBytes = estimateSerializableBytes(history[0]);
  assert.deepEqual(trimHistoryByEstimatedBytes(history, 10, entryBytes * 2 + 1), history.slice(-2));
  assert.deepEqual(trimHistoryByEstimatedBytes(history, 2, 10_000), history.slice(-2));
});

test("exportación rechaza dimensiones o memoria inseguras antes de crear canvas", () => {
  assert.equal(estimateExportMemory(1920, 1080), 41_472_000);
  assert.doesNotThrow(() => validateExportDimensions(6000, 4000));
  assert.throws(() => validateExportDimensions(20_000, 100));
  assert.throws(() => validateExportDimensions(16_000, 16_000));
});

test("ObjectUrlManager reemplaza y libera URLs temporales", () => {
  const manager = new ObjectUrlManager();
  manager.create("image", new Blob(["first"]));
  manager.create("image", new Blob(["second"]));
  assert.equal(manager.size, 1);
  manager.clear();
  assert.equal(manager.size, 0);
});
