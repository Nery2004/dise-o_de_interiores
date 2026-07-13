import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { featherAlphaMask } from "@/lib/paint/featherAlpha";
import { PaintRenderPipeline, type PaintRenderInput } from "@/lib/paint/PaintRenderPipeline";
import { analyzeWallPixels } from "@/lib/paint/wallColorAnalyzer";
import { DEFAULT_WHITE_BASE_SETTINGS, resolveEffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import { calculatePaintColorMetrics } from "@/lib/paint/evaluation/colorMetrics";
import { calculateLuminancePreservationScore, calculateShadowStructureScore, calculateTexturePreservationScore } from "@/lib/paint/evaluation/structureMetrics";
import { calculatePreviewExportDifference } from "@/lib/paint/evaluation/previewExportMetrics";
import { calculateFeatherMetrics } from "@/lib/paint/evaluation/featherMetrics";
import type { BlendMode, PaintMode, RenderQuality } from "@/types/editor";

export type PaintFixtureMetadata = {
  id: string;
  description: string;
  targetColor: string;
  width: number;
  height: number;
  image: string;
  mask: string;
  synthetic: boolean;
  notes: string;
  settings: {
    paintMode: PaintMode;
    paintIntensity: number;
    primerCoverage: number;
    shadowPreservation: number;
    texturePreservation: number;
    edgeFeather: number;
    blendMode: BlendMode;
    quality: RenderQuality;
  };
};

export type LoadedPaintFixture = {
  directory: string;
  metadata: PaintFixtureMetadata;
  original: Uint8ClampedArray;
  binaryMask: Uint8ClampedArray;
};

export async function loadPaintFixtures(root: string): Promise<LoadedPaintFixture[]> {
  const entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const fixtures: LoadedPaintFixture[] = [];
  for (const entry of entries) {
    const directory = path.join(root, entry.name);
    const metadata = JSON.parse(await readFile(path.join(directory, "metadata.json"), "utf8")) as PaintFixtureMetadata;
    const image = await sharp(path.join(directory, metadata.image)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mask = await sharp(path.join(directory, metadata.mask)).greyscale().raw().toBuffer({ resolveWithObject: true });
    fixtures.push({
      directory,
      metadata,
      original: new Uint8ClampedArray(image.data),
      binaryMask: Uint8ClampedArray.from({ length: metadata.width * metadata.height }, (_, index) => mask.data[index * mask.info.channels]),
    });
  }
  return fixtures;
}

function boundsFor(alpha: Uint8ClampedArray, width: number, height: number) {
  let minX = width; let minY = height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (alpha[y * width + x]) {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, width: Math.max(0, maxX - minX + 1), height: Math.max(0, maxY - minY + 1) };
}

export function compositeLayer(original: Uint8ClampedArray, layer: Uint8ClampedArray) {
  const output = original.slice();
  for (let index = 0; index < original.length / 4; index += 1) {
    const offset = index * 4;
    const alpha = layer[offset + 3] / 255;
    for (let channel = 0; channel < 3; channel += 1) output[offset + channel] = Math.round(layer[offset + channel] * alpha + original[offset + channel] * (1 - alpha));
    output[offset + 3] = 255;
  }
  return output;
}

export function buildPaintInput(fixture: LoadedPaintFixture, quality: RenderQuality, overrides: Partial<PaintRenderInput> = {}): PaintRenderInput {
  const { metadata } = fixture;
  const edgeFeather = overrides.edgeFeather ?? metadata.settings.edgeFeather;
  const primerCoverage = overrides.primerCoverage ?? metadata.settings.primerCoverage;
  const feathered = featherAlphaMask(fixture.binaryMask, metadata.width, metadata.height, edgeFeather);
  const source = { data: fixture.original, width: metadata.width, height: metadata.height, scale: 1 };
  const analysis = analyzeWallPixels({
    source,
    mask: { alpha: fixture.binaryMask, bounds: boundsFor(fixture.binaryMask, metadata.width, metadata.height), width: metadata.width, height: metadata.height },
    quality: "ultra",
  });
  const neutralizationSettings = overrides.neutralizationSettings ?? resolveEffectiveWhiteBaseSettings(DEFAULT_WHITE_BASE_SETTINGS, analysis, primerCoverage);
  return {
    originalImage: { data: fixture.original, width: metadata.width, height: metadata.height },
    mask: { alpha: feathered, width: metadata.width, height: metadata.height },
    targetColor: metadata.targetColor,
    paintMode: metadata.settings.paintMode,
    paintIntensity: metadata.settings.paintIntensity,
    primerCoverage,
    neutralizationSettings,
    shadowPreservation: metadata.settings.shadowPreservation,
    texturePreservation: metadata.settings.texturePreservation,
    edgeFeather,
    blendMode: metadata.settings.blendMode,
    quality,
    diagnostics: true,
    ...overrides,
  };
}

export function evaluatePaintFixture(fixture: LoadedPaintFixture, overrides: Partial<PaintRenderInput> = {}) {
  const pipeline = new PaintRenderPipeline();
  const draft = pipeline.render(buildPaintInput(fixture, "draft", overrides));
  const preview = pipeline.render(buildPaintInput(fixture, "high", overrides));
  const exported = pipeline.render(buildPaintInput(fixture, "ultra", overrides));
  const draftComposite = compositeLayer(fixture.original, draft.imageData);
  const previewComposite = compositeLayer(fixture.original, preview.imageData);
  const exportComposite = compositeLayer(fixture.original, exported.imageData);
  const color = calculatePaintColorMetrics({ original: fixture.original, rendered: exportComposite, maskAlpha: fixture.binaryMask, targetColor: fixture.metadata.targetColor });
  const luminance = calculateLuminancePreservationScore(fixture.original, exportComposite, fixture.binaryMask);
  const texture = calculateTexturePreservationScore(fixture.original, exportComposite, fixture.binaryMask, fixture.metadata.width, fixture.metadata.height);
  const shadows = calculateShadowStructureScore(fixture.original, exportComposite, fixture.binaryMask);
  const previewExport = calculatePreviewExportDifference(previewComposite, exportComposite, fixture.binaryMask);
  const draftExport = calculatePreviewExportDifference(draftComposite, exportComposite, fixture.binaryMask);
  const feathered = buildPaintInput(fixture, "ultra", overrides).mask.alpha;
  const feather = calculateFeatherMetrics(feathered, fixture.binaryMask, fixture.metadata.width, fixture.metadata.height);
  return {
    draft,
    preview,
    exported,
    previewComposite,
    exportComposite,
    metrics: { color, luminance, texture, shadows, previewExport, draftExport, feather },
    approximateMemoryBytes: fixture.original.byteLength + fixture.binaryMask.byteLength + draft.imageData.byteLength + preview.imageData.byteLength + exported.imageData.byteLength + (draft.diagnostics?.luminance.byteLength ?? 0) + (preview.diagnostics?.luminance.byteLength ?? 0) + (exported.diagnostics?.luminance.byteLength ?? 0),
  };
}
