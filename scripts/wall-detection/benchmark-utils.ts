import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { calculateBinaryMaskMetrics, unionMasks, type BinaryMaskMetrics } from "@/lib/wall-detection/evaluation/metrics";
import { calculateBoundaryMetrics, calculateBoundaryMetricsAtTolerances, extractBoundary, type BoundaryMetrics } from "@/lib/wall-detection/evaluation/boundaryMetrics";
import { calculateExclusionLeakageByRegion, type ExclusionLeakageMetric, type ExclusionRegionType } from "@/lib/wall-detection/evaluation/exclusionMetrics";
import { calculateFragmentationMetrics, type FragmentationMetrics } from "@/lib/wall-detection/evaluation/fragmentationMetrics";
import { calculatePolygonComplexity, type PolygonComplexityMetrics } from "@/lib/wall-detection/evaluation/polygonComplexity";
import { calculateWallQualityScore } from "@/lib/wall-detection/evaluation/qualityScore";
import { matchPredictedWallsToExpectedWalls, type WallMatchingResult } from "@/lib/wall-detection/evaluation/matching";
import { classifyWallDetectionErrors, type WallDetectionErrorCategory } from "@/lib/wall-detection/evaluation/errorClassification";
import { DEFAULT_WALL_DETECTION_EVALUATION_CONFIG } from "@/lib/wall-detection/evaluation/config";
import { ContourExtractor } from "@/lib/wallDetection/pipeline/ContourExtractor";
import { PolygonOptimizer } from "@/lib/wallDetection/pipeline/PolygonOptimizer";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";
import type { WallDetectionPoint } from "@/lib/wallDetection/types";

export type FixtureMetadata = {
  id: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  expectedWalls: number;
  excludeRegions: ExclusionRegionType[];
  tags: string[];
  notes: string;
  synthetic: boolean;
  width: number;
  height: number;
  expectedMasks: string[];
  recordedPredictions: string[];
  exclusionMasks: Partial<Record<ExclusionRegionType, string>>;
};

export type LoadedWallFixture = {
  directory: string;
  imagePath: string;
  imageBuffer: Buffer;
  metadata: FixtureMetadata;
  expected: BinaryMask[];
  recorded: BinaryMask[];
  exclusions: Partial<Record<ExclusionRegionType, BinaryMask>>;
};

export type StageEvaluation = {
  binary: BinaryMaskMetrics;
  boundary: BoundaryMetrics;
  boundariesByTolerance: ReturnType<typeof calculateBoundaryMetricsAtTolerances>;
  exclusions: ExclusionLeakageMetric[];
  exclusionLeakage: number;
  fragmentation: FragmentationMetrics;
  polygon: PolygonComplexityMetrics;
  matching: WallMatchingResult;
  qualityScore: number;
  errors: WallDetectionErrorCategory[];
  maskBytes: number;
};

export async function loadBinaryMask(filePath: string, threshold = DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.binaryThreshold): Promise<BinaryMask> {
  const { data, info } = await sharp(filePath).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const output = new Uint8Array(info.width * info.height);
  for (let index = 0; index < output.length; index += 1)
    output[index] = data[index * info.channels] / 255 >= threshold ? 1 : 0;
  return { width: info.width, height: info.height, data: output };
}

export async function loadWallDetectionFixtures(root: string): Promise<LoadedWallFixture[]> {
  const entries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((first, second) => first.name.localeCompare(second.name));
  const fixtures: LoadedWallFixture[] = [];
  for (const entry of entries) {
    const directory = path.join(root, entry.name);
    const metadata = JSON.parse(await readFile(path.join(directory, "metadata.json"), "utf8")) as FixtureMetadata;
    if (metadata.width > DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.maximumFixtureDimension || metadata.height > DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.maximumFixtureDimension)
      throw new Error(`Fixture fuera de límite: ${metadata.id}`);
    const exclusions: Partial<Record<ExclusionRegionType, BinaryMask>> = {};
    for (const [type, filename] of Object.entries(metadata.exclusionMasks))
      exclusions[type as ExclusionRegionType] = await loadBinaryMask(path.join(directory, filename));
    fixtures.push({
      directory,
      imagePath: path.join(directory, "image.webp"),
      imageBuffer: await readFile(path.join(directory, "image.webp")),
      metadata,
      expected: await Promise.all(metadata.expectedMasks.map((filename) => loadBinaryMask(path.join(directory, filename)))),
      recorded: await Promise.all(metadata.recordedPredictions.map((filename) => loadBinaryMask(path.join(directory, filename)))),
      exclusions,
    });
  }
  return fixtures;
}

function blankMask(reference: BinaryMask): BinaryMask {
  return { width: reference.width, height: reference.height, data: new Uint8Array(reference.data.length) };
}

function aggregatePolygonComplexity(polygons: WallDetectionPoint[][], width: number, height: number): PolygonComplexityMetrics {
  const metrics = polygons.length
    ? polygons.map((polygon) => calculatePolygonComplexity(polygon, width, height))
    : [calculatePolygonComplexity([], width, height)];
  const average = (key: keyof PolygonComplexityMetrics) => metrics.reduce((sum, item) => sum + item[key], 0) / metrics.length;
  return {
    pointCount: metrics.reduce((sum, item) => sum + item.pointCount, 0),
    area: metrics.reduce((sum, item) => sum + item.area, 0),
    perimeter: metrics.reduce((sum, item) => sum + item.perimeter, 0),
    compactness: average("compactness"),
    shortSegmentRatio: average("shortSegmentRatio"),
    sharpTurnRatio: average("sharpTurnRatio"),
    zigzagRatio: average("zigzagRatio"),
    polygonComplexityScore: average("polygonComplexityScore"),
  };
}

export function polygonsForMasks(masks: BinaryMask[], tolerance = DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.polygonSimplificationTolerance) {
  const contours = new ContourExtractor();
  const optimizer = new PolygonOptimizer();
  return masks.map((mask) => optimizer.optimize(contours.extract(mask), tolerance));
}

export function evaluateStage(
  predictedMasks: BinaryMask[],
  expectedMasks: BinaryMask[],
  exclusions: Partial<Record<ExclusionRegionType, BinaryMask>>,
  polygons = polygonsForMasks(predictedMasks),
): StageEvaluation {
  if (!expectedMasks.length) throw new Error("El fixture no contiene ground truth.");
  const expectedUnion = unionMasks(expectedMasks);
  const predictedUnion = predictedMasks.length ? unionMasks(predictedMasks) : blankMask(expectedUnion);
  const binary = calculateBinaryMaskMetrics(predictedUnion, expectedUnion);
  const boundary = calculateBoundaryMetrics(predictedUnion, expectedUnion, 3);
  const exclusionMetrics = calculateExclusionLeakageByRegion(predictedUnion, exclusions);
  const exclusionPixels = exclusionMetrics.reduce((sum, item) => sum + item.exclusionPixels, 0);
  const exclusionLeakage = exclusionPixels
    ? exclusionMetrics.reduce((sum, item) => sum + item.incorrectPixels, 0) / exclusionPixels
    : 0;
  const fragmentation = calculateFragmentationMetrics(predictedUnion);
  const polygon = aggregatePolygonComplexity(polygons, predictedUnion.width, predictedUnion.height);
  const matching = matchPredictedWallsToExpectedWalls(predictedMasks, expectedMasks);
  const qualityScore = calculateWallQualityScore({
    iou: binary.intersectionOverUnion,
    dice: binary.diceCoefficient,
    boundaryIou: boundary.boundaryIntersectionOverUnion,
    precision: binary.precision,
    recall: binary.recall,
    fragmentationScore: fragmentation.fragmentationScore,
    polygonComplexityScore: polygon.polygonComplexityScore,
  });
  return {
    binary,
    boundary,
    boundariesByTolerance: calculateBoundaryMetricsAtTolerances(predictedUnion, expectedUnion, DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.boundaryTolerances),
    exclusions: exclusionMetrics,
    exclusionLeakage,
    fragmentation,
    polygon,
    matching,
    qualityScore,
    errors: classifyWallDetectionErrors({ binary, boundary, exclusions: exclusionMetrics, fragmentation, polygon, matching }),
    maskBytes: predictedMasks.reduce((sum, mask) => sum + mask.data.byteLength, 0),
  };
}

function rgbMask(mask: BinaryMask, color: [number, number, number]): Buffer {
  const output = Buffer.alloc(mask.data.length * 3);
  for (let index = 0; index < mask.data.length; index += 1) if (mask.data[index]) {
    output[index * 3] = color[0]; output[index * 3 + 1] = color[1]; output[index * 3 + 2] = color[2];
  }
  return output;
}

async function writeRgb(target: string, data: Buffer, width: number, height: number) {
  await sharp(data, { raw: { width, height, channels: 3 } }).png({ compressionLevel: 9 }).toFile(target);
}

export async function writeBenchmarkVisuals(
  outputRoot: string,
  fixture: LoadedWallFixture,
  predictedMasks: BinaryMask[],
) {
  const directory = path.join(outputRoot, fixture.metadata.id);
  await mkdir(directory, { recursive: true });
  const expected = unionMasks(fixture.expected);
  const predicted = predictedMasks.length ? unionMasks(predictedMasks) : blankMask(expected);
  await sharp(fixture.imagePath).png().toFile(path.join(directory, "original.png"));
  await writeRgb(path.join(directory, "ground-truth.png"), rgbMask(expected, [255, 255, 255]), expected.width, expected.height);
  await writeRgb(path.join(directory, "prediction.png"), rgbMask(predicted, [255, 255, 255]), expected.width, expected.height);
  const overlay = Buffer.alloc(expected.data.length * 3);
  const falsePositive = Buffer.alloc(expected.data.length * 3);
  const falseNegative = Buffer.alloc(expected.data.length * 3);
  for (let index = 0; index < expected.data.length; index += 1) {
    const prediction = Boolean(predicted.data[index]);
    const truth = Boolean(expected.data[index]);
    const color: [number, number, number] = prediction && truth ? [30, 190, 80] : prediction ? [230, 45, 45] : truth ? [40, 100, 230] : [0, 0, 0];
    overlay[index * 3] = color[0]; overlay[index * 3 + 1] = color[1]; overlay[index * 3 + 2] = color[2];
    if (prediction && !truth) falsePositive[index * 3] = 230;
    if (truth && !prediction) falseNegative[index * 3 + 2] = 230;
  }
  await writeRgb(path.join(directory, "overlay.png"), overlay, expected.width, expected.height);
  await writeRgb(path.join(directory, "false-positive.png"), falsePositive, expected.width, expected.height);
  await writeRgb(path.join(directory, "false-negative.png"), falseNegative, expected.width, expected.height);
  const boundaryImage = Buffer.alloc(expected.data.length * 3);
  const predictedBoundary = new Set(extractBoundary(predicted).map((point) => `${point.x}:${point.y}`));
  const expectedBoundary = new Set(extractBoundary(expected).map((point) => `${point.x}:${point.y}`));
  for (let y = 0; y < expected.height; y += 1) for (let x = 0; x < expected.width; x += 1) {
    const index = y * expected.width + x;
    const key = `${x}:${y}`;
    const both = predictedBoundary.has(key) && expectedBoundary.has(key);
    if (both) { boundaryImage[index * 3] = 255; boundaryImage[index * 3 + 1] = 220; }
    else if (predictedBoundary.has(key)) boundaryImage[index * 3] = 230;
    else if (expectedBoundary.has(key)) boundaryImage[index * 3 + 2] = 230;
  }
  await writeRgb(path.join(directory, "boundaries.png"), boundaryImage, expected.width, expected.height);
  await writeRgb(path.join(directory, "refined.png"), rgbMask(predicted, [255, 255, 255]), expected.width, expected.height);
  await writeFile(path.join(directory, "legend.md"), "# Leyenda\n\n- Verde: verdadero positivo\n- Rojo: falso positivo\n- Azul: falso negativo\n- Amarillo: borde coincidente\n\nLas imágenes se acompañan por nombre y no dependen únicamente del color.\n");
}
