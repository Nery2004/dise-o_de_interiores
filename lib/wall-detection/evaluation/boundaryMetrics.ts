import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";
import { assertCompatibleMasks } from "@/lib/wall-detection/evaluation/metrics";

type Point = { x: number; y: number };

export type BoundaryMetrics = {
  tolerance: number;
  boundaryIntersectionOverUnion: number;
  meanBoundaryDistance: number;
  boundaryWithinTolerance: number;
  approximateMaximumError: number;
  approximateHausdorffDistance: number;
  predictedBoundaryPixels: number;
  expectedBoundaryPixels: number;
};

export function extractBoundary(mask: BinaryMask): Point[] {
  const points: Point[] = [];
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (!mask.data[y * mask.width + x]) continue;
      if (
        x === 0 || y === 0 || x === mask.width - 1 || y === mask.height - 1 ||
        !mask.data[y * mask.width + x - 1] ||
        !mask.data[y * mask.width + x + 1] ||
        !mask.data[(y - 1) * mask.width + x] ||
        !mask.data[(y + 1) * mask.width + x]
      )
        points.push({ x, y });
    }
  }
  return points;
}

function nearestDistances(source: Point[], target: Point[]) {
  if (!source.length) return [];
  if (!target.length) return source.map(() => Number.POSITIVE_INFINITY);
  return source.map((point) => {
    let minimum = Number.POSITIVE_INFINITY;
    for (const candidate of target) {
      const distance = Math.hypot(point.x - candidate.x, point.y - candidate.y);
      if (distance < minimum) minimum = distance;
      if (minimum === 0) break;
    }
    return minimum;
  });
}

function boundaryBand(points: Point[], width: number, height: number, tolerance: number) {
  const band = new Uint8Array(width * height);
  const radius = Math.max(0, Math.floor(tolerance));
  for (const point of points) {
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        if (offsetX * offsetX + offsetY * offsetY > radius * radius) continue;
        const x = point.x + offsetX;
        const y = point.y + offsetY;
        if (x >= 0 && y >= 0 && x < width && y < height) band[y * width + x] = 1;
      }
    }
  }
  return band;
}

export function calculateBoundaryMetrics(
  predicted: BinaryMask,
  expected: BinaryMask,
  tolerance: number,
): BoundaryMetrics {
  assertCompatibleMasks(predicted, expected);
  const predictedBoundary = extractBoundary(predicted);
  const expectedBoundary = extractBoundary(expected);
  const bothEmpty = predictedBoundary.length === 0 && expectedBoundary.length === 0;
  const predictedDistances = nearestDistances(predictedBoundary, expectedBoundary);
  const expectedDistances = nearestDistances(expectedBoundary, predictedBoundary);
  const distances = [...predictedDistances, ...expectedDistances];
  const finiteDistances = distances.filter(Number.isFinite);
  const predictedBand = boundaryBand(predictedBoundary, predicted.width, predicted.height, tolerance);
  const expectedBand = boundaryBand(expectedBoundary, expected.width, expected.height, tolerance);
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < predictedBand.length; index += 1) {
    if (predictedBand[index] && expectedBand[index]) intersection += 1;
    if (predictedBand[index] || expectedBand[index]) union += 1;
  }
  const maximum = distances.some((distance) => !Number.isFinite(distance))
    ? Math.hypot(predicted.width, predicted.height)
    : Math.max(0, ...finiteDistances);
  return {
    tolerance,
    boundaryIntersectionOverUnion: union ? intersection / union : bothEmpty ? 1 : 0,
    meanBoundaryDistance: finiteDistances.length
      ? finiteDistances.reduce((sum, value) => sum + value, 0) / finiteDistances.length
      : bothEmpty ? 0 : Math.hypot(predicted.width, predicted.height),
    boundaryWithinTolerance: distances.length
      ? distances.filter((distance) => distance <= tolerance).length / distances.length
      : bothEmpty ? 1 : 0,
    approximateMaximumError: maximum,
    approximateHausdorffDistance: maximum,
    predictedBoundaryPixels: predictedBoundary.length,
    expectedBoundaryPixels: expectedBoundary.length,
  };
}

export function calculateBoundaryMetricsAtTolerances(
  predicted: BinaryMask,
  expected: BinaryMask,
  tolerances: readonly number[],
) {
  return Object.fromEntries(
    tolerances.map((tolerance) => [String(tolerance), calculateBoundaryMetrics(predicted, expected, tolerance)]),
  );
}
