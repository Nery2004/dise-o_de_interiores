import assert from "node:assert/strict";
import test from "node:test";
import { EdgeAligner } from "@/lib/wallDetection/pipeline/EdgeAligner";
import { HoleRemover } from "@/lib/wallDetection/pipeline/HoleRemover";
import { NoiseCleaner } from "@/lib/wallDetection/pipeline/NoiseCleaner";
import { countMaskPixels } from "@/lib/wallDetection/pipeline/MaskOperations";
import { resolveRefinementSettings } from "@/lib/wallDetection/pipeline/RefinementSettings";
import { WallRefinementPipeline } from "@/lib/wallDetection/pipeline/WallRefinementPipeline";
import { SegmentationPipeline } from "@/lib/wallDetection/pipeline/SegmentationPipeline";
import type { BinaryMask, EdgeMap } from "@/lib/wallDetection/pipeline/types";

function mask(width: number, height: number, fill: (x: number, y: number) => boolean): BinaryMask {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (fill(x, y)) data[y * width + x] = 1;
  return { width, height, data };
}

function edgeMap(width: number, height: number, edge: (x: number, y: number) => boolean): EdgeMap {
  const magnitude = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (edge(x, y)) magnitude[y * width + x] = 255;
  return { width, height, magnitude, luminance: new Uint8Array(width * height), threshold: 100 };
}

test("Edge Alignment respeta el desplazamiento máximo configurable", () => {
  const source = mask(24, 16, (x, y) => x >= 5 && x <= 20 && y >= 2 && y <= 13);
  const edges = edgeMap(24, 16, (x) => x === 9);
  const aligned = new EdgeAligner().align(source, edges, 8, 2);
  assert.equal(aligned.data[6 * 24 + 5], 1, "un borde fuera del límite no debe atraer la máscara");
  const nearbyEdges = edgeMap(24, 16, (x) => x === 7);
  const moved = new EdgeAligner().align(source, nearbyEdges, 8, 2);
  assert.equal(moved.data[6 * 24 + 5], 0);
  assert.equal(moved.data[6 * 24 + 7], 1);
});

test("rellena huecos pequeños, conserva ventanas y no cierra huecos grandes", () => {
  const source = mask(40, 30, (x, y) => x >= 2 && x <= 37 && y >= 2 && y <= 27 && !(x >= 8 && x <= 9 && y >= 8 && y <= 9) && !(x >= 20 && x <= 29 && y >= 8 && y <= 19));
  const window = mask(40, 30, (x, y) => x >= 20 && x <= 29 && y >= 8 && y <= 19);
  const cleaned = new HoleRemover().remove(source, 0.01, [window]);
  assert.equal(cleaned.data[8 * 40 + 8], 1, "el hueco pequeño debe rellenarse");
  assert.equal(cleaned.data[12 * 40 + 24], 0, "la ventana debe conservarse");
});

test("Noise Removal conserva la pared dominante y elimina muebles o islas aisladas", () => {
  const source = mask(80, 50, (x, y) => (x >= 4 && x <= 60 && y >= 4 && y <= 44) || (x >= 70 && x <= 74 && y >= 40 && y <= 44) || (x === 77 && y === 2));
  const cleaned = new NoiseCleaner().clean(source, 0.001);
  assert.equal(cleaned.data[20 * 80 + 20], 1);
  assert.equal(cleaned.data[42 * 80 + 72], 0);
  assert.equal(cleaned.data[2 * 80 + 77], 0);
});

const visualCases = [
  { name: "Habitación moderna", fill: (x: number, y: number) => x > 5 && x < 58 && y > 4 && y < 41 },
  { name: "Sala", fill: (x: number, y: number) => x > 3 && x < 60 && y > 6 && y < 43 && !(x > 28 && x < 36 && y > 30) },
  { name: "Dormitorio", fill: (x: number, y: number) => x > 7 && x < 56 && y > 3 && y < 42 },
  { name: "Oficina", fill: (x: number, y: number) => x > 4 && x < 59 && y > 8 && y < 43 },
  { name: "Pared blanca", fill: (x: number, y: number) => x > 5 && x < 58 && y > 5 && y < 42 },
  { name: "Pared beige", fill: (x: number, y: number) => x > 6 && x < 57 && y > 4 && y < 41 },
  { name: "Pared con ventana", fill: (x: number, y: number) => x > 4 && x < 59 && y > 4 && y < 43 && !(x > 22 && x < 39 && y > 13 && y < 30) },
  { name: "Pared con cuadro", fill: (x: number, y: number) => x > 4 && x < 59 && y > 4 && y < 43 && !(x > 26 && x < 35 && y > 15 && y < 23) },
  { name: "Pared con sofá", fill: (x: number, y: number) => x > 4 && x < 59 && y > 4 && y < 43 && !(x > 17 && x < 47 && y > 33) },
] as const;

for (const scenario of visualCases) test(`regresión raster visual: ${scenario.name}`, () => {
  const source = mask(64, 48, scenario.fill);
  const result = new WallRefinementPipeline().run(source, { edgeMap: null, lines: [], exclusions: [], providerConfidence: 0.9 }, resolveRefinementSettings());
  assert.ok(result.polygon.length >= 3, "debe producir un polígono editable");
  assert.ok(result.qualityScore >= 0 && result.qualityScore <= 100);
  assert.ok(countMaskPixels(result.mask) > 0);
});

test("reintenta con parámetros conservadores y entrega una sola mejor máscara", () => {
  const source = mask(50, 35, (x, y) => x > 5 && x < 45 && y > 4 && y < 31);
  const result = new WallRefinementPipeline().run(source, { edgeMap: null, lines: [], exclusions: [], providerConfidence: 0.3 }, resolveRefinementSettings({ qualityThreshold: 100 }));
  assert.equal(result.retryCount, 1);
  assert.ok(result.qualityScore >= 0 && result.qualityScore <= 100);
});

test("cada etapa puede desactivarse de forma independiente", () => {
  const source = mask(40, 30, (x, y) => x > 4 && x < 35 && y > 3 && y < 26);
  const settings = resolveRefinementSettings({ stages: {
    edgeAlignment: false, perspectiveCorrection: false, gapFilling: false, holeRemoval: false,
    noiseRemoval: false, boundaryOptimization: false, cornerSnap: false, polygonOptimization: false,
  } });
  const result = new WallRefinementPipeline().run(source, { edgeMap: null, lines: [], exclusions: [], providerConfidence: 0.9 }, settings);
  assert.deepEqual(result.appliedStages, []);
});

test("transporta exclusiones de ventanas hasta la máscara editable", async () => {
  const wall = mask(64, 48, (x, y) => x > 3 && x < 60 && y > 3 && y < 44);
  const window = mask(64, 48, (x, y) => x > 23 && x < 40 && y > 13 && y < 31);
  const result = await new SegmentationPipeline().run({
    async segmentWalls() { return { modelVersion: "exclusion-fixture", regions: [{ id: "wall-window", confidence: 0.9, mask: wall, exclusionMasks: [window] }] }; },
  }, { imageBuffer: Buffer.from("fixture"), mimeType: "image/png", dimensions: { width: 640, height: 480 }, signal: new AbortController().signal });
  assert.equal(result.walls.length, 1);
  assert.equal(result.walls[0].exclusionPolygons?.length, 1);
  assert.ok((result.walls[0].exclusionPolygons?.[0].length ?? 0) >= 3);
});
