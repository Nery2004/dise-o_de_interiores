import assert from "node:assert/strict";
import test from "node:test";
import { calculateBinaryMaskMetrics } from "@/lib/wall-detection/evaluation/metrics";
import { calculateBoundaryMetrics } from "@/lib/wall-detection/evaluation/boundaryMetrics";
import { calculateExclusionLeakage } from "@/lib/wall-detection/evaluation/exclusionMetrics";
import { calculateFragmentationMetrics } from "@/lib/wall-detection/evaluation/fragmentationMetrics";
import { calculatePolygonComplexity } from "@/lib/wall-detection/evaluation/polygonComplexity";
import { calculateWallQualityScore } from "@/lib/wall-detection/evaluation/qualityScore";
import { matchPredictedWallsToExpectedWalls } from "@/lib/wall-detection/evaluation/matching";
import { getMorphologyKernelSize } from "@/lib/wall-detection/evaluation/config";
import { createWallDetectionCacheKey } from "@/lib/wallDetection/cacheKey";
import { WALL_DETECTION_PIPELINE_VERSION } from "@/lib/wallDetection/pipeline/version";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

function mask(width: number, height: number, fill: (x: number, y: number) => boolean): BinaryMask {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      if (fill(x, y)) data[y * width + x] = 1;
  return { width, height, data };
}

const expected = mask(10, 10, (x, y) => x >= 2 && x <= 7 && y >= 2 && y <= 7);

test("métricas binarias cubren coincidencia perfecta y ausencia de intersección", () => {
  const perfect = calculateBinaryMaskMetrics(expected, expected);
  assert.equal(perfect.intersectionOverUnion, 1);
  assert.equal(perfect.diceCoefficient, 1);
  assert.equal(perfect.precision, 1);
  assert.equal(perfect.recall, 1);
  assert.equal(perfect.f1Score, 1);
  assert.equal(perfect.pixelAccuracy, 1);
  assert.equal(perfect.falsePositiveRate, 0);
  assert.equal(perfect.falseNegativeRate, 0);
  const disjoint = calculateBinaryMaskMetrics(
    mask(10, 10, (x, y) => x < 2 && y < 2),
    expected,
  );
  assert.equal(disjoint.intersectionOverUnion, 0);
  assert.equal(disjoint.diceCoefficient, 0);
});

test("precision y recall distinguen predicción mayor y menor", () => {
  const larger = calculateBinaryMaskMetrics(mask(10, 10, (x, y) => x >= 1 && x <= 8 && y >= 1 && y <= 8), expected);
  assert.equal(larger.recall, 1);
  assert.ok(larger.precision < 1);
  const smaller = calculateBinaryMaskMetrics(mask(10, 10, (x, y) => x >= 3 && x <= 6 && y >= 3 && y <= 6), expected);
  assert.equal(smaller.precision, 1);
  assert.ok(smaller.recall < 1);
});

test("métricas de borde detectan desplazamiento y respetan tolerancia", () => {
  const shifted = mask(10, 10, (x, y) => x >= 3 && x <= 8 && y >= 2 && y <= 7);
  const exact = calculateBoundaryMetrics(expected, expected, 1);
  const strict = calculateBoundaryMetrics(shifted, expected, 0);
  const tolerant = calculateBoundaryMetrics(shifted, expected, 3);
  assert.equal(exact.boundaryIntersectionOverUnion, 1);
  assert.equal(exact.meanBoundaryDistance, 0);
  assert.ok(strict.boundaryIntersectionOverUnion < tolerant.boundaryIntersectionOverUnion);
  assert.ok(tolerant.boundaryWithinTolerance > strict.boundaryWithinTolerance);
  assert.ok(strict.approximateHausdorffDistance >= 1);
});

test("leakage mide píxeles incorrectos dentro de una exclusión", () => {
  const exclusion = mask(10, 10, (x, y) => x >= 4 && x <= 5 && y >= 4 && y <= 5);
  const leakage = calculateExclusionLeakage(expected, exclusion, "window");
  assert.equal(leakage.incorrectPixels, 4);
  assert.equal(leakage.overlapRatio, 1);
  assert.equal(leakage.exclusionLeakageScore, 100);
});

test("fragmentación contabiliza islas y huecos internos", () => {
  const fragmented = mask(12, 10, (x, y) =>
    (x >= 1 && x <= 7 && y >= 1 && y <= 8 && !(x >= 3 && x <= 4 && y >= 3 && y <= 4)) ||
    (x === 10 && y === 8),
  );
  const metrics = calculateFragmentationMetrics(fragmented);
  assert.equal(metrics.connectedComponents, 2);
  assert.equal(metrics.holeCount, 1);
  assert.equal(metrics.totalHoleArea, 4);
  assert.ok(metrics.fragmentationScore > 0);
});

test("complejidad poligonal penaliza zigzags y conserva rectángulos editables", () => {
  const rectangle = calculatePolygonComplexity([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 9 }, { x: 1, y: 9 }], 10, 10);
  const zigzag = calculatePolygonComplexity(Array.from({ length: 24 }, (_, index) => ({ x: index % 2 ? 8 : 2, y: index * 0.35 })), 10, 10);
  assert.ok(rectangle.polygonComplexityScore < zigzag.polygonComplexityScore);
  assert.equal(rectangle.pointCount, 4);
});

test("quality score usa pesos centralizados y alcanza 100 para resultado perfecto", () => {
  assert.equal(calculateWallQualityScore({ iou: 1, dice: 1, boundaryIou: 1, precision: 1, recall: 1, fragmentationScore: 0, polygonComplexityScore: 0 }), 100);
  assert.throws(() => calculateWallQualityScore({ iou: 1, dice: 1, boundaryIou: 1, precision: 1, recall: 1, fragmentationScore: 0, polygonComplexityScore: 0 }, { iou: 1, dice: 1, boundaryIou: 1, precision: 1, recall: 1, fragmentation: 1, polygonSimplicity: 1 }));
});

test("matching maximiza IoU y separa faltantes, extras y duplicados", () => {
  const second = mask(10, 10, (x, y) => x >= 0 && x <= 1 && y >= 5);
  const result = matchPredictedWallsToExpectedWalls([expected, expected], [expected, second]);
  assert.equal(result.matches.length, 1);
  assert.deepEqual(result.missedExpectedIndexes, [1]);
  assert.equal(result.extraPredictionIndexes.length, 1);
  assert.deepEqual(result.duplicatePredictionIndexes, result.extraPredictionIndexes);
});

test("kernel morfológico escala con resolución dentro de límites", () => {
  assert.equal(getMorphologyKernelSize(96, 64), 1);
  assert.equal(getMorphologyKernelSize(1920, 1080), 5);
  assert.equal(getMorphologyKernelSize(10_000, 10_000), 5);
});

test("cache key es estable e invalida por provider, configuración y versión", () => {
  const base = { imageHash: "abc", provider: "mock", providerVersion: "1", configuration: { b: 2, a: 1 } };
  const first = createWallDetectionCacheKey(base);
  const reordered = createWallDetectionCacheKey({ ...base, configuration: { a: 1, b: 2 } });
  assert.equal(first, reordered);
  assert.notEqual(first, createWallDetectionCacheKey({ ...base, providerVersion: "2" }));
  assert.notEqual(first, createWallDetectionCacheKey({ ...base, configuration: { a: 1, b: 3 } }));
  assert.match(first, new RegExp(WALL_DETECTION_PIPELINE_VERSION.replaceAll(".", "\\.")));
});
