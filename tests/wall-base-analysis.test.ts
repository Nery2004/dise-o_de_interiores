import assert from "node:assert/strict";
import test from "node:test";
import { hexToRgbColor } from "@/lib/colors/colorSpace";
import type { FeatheredMask } from "@/lib/paint/MaskFeatherPass";
import type { SourceRaster } from "@/lib/paint/imageRaster";
import { createWallAnalysisKey } from "@/lib/paint/wallBaseAnalysisService";
import {
  analyzeWallPixels,
  classifyWallColor,
  trimmedMean,
} from "@/lib/paint/wallColorAnalyzer";
import {
  clampWhiteBaseSettings,
  DEFAULT_WHITE_BASE_SETTINGS,
  getRecommendedWhiteBaseSettings,
} from "@/lib/paint/whiteBaseOptimizer";
import type { LoadedImage, WallMask } from "@/types/editor";

function makeRaster(colors: string[], width = colors.length): SourceRaster {
  const height = Math.ceil(colors.length / width);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const color = hexToRgbColor(colors[index] ?? colors.at(-1) ?? "#808080");
    data[index * 4] = Math.round(color.r * 255);
    data[index * 4 + 1] = Math.round(color.g * 255);
    data[index * 4 + 2] = Math.round(color.b * 255);
    data[index * 4 + 3] = 255;
  }
  return { data, width, height, scale: 1 };
}

function fullMask(width: number, height: number): FeatheredMask {
  return {
    alpha: new Uint8ClampedArray(width * height).fill(255),
    bounds: { x: 0, y: 0, width, height },
    width,
    height,
  };
}

function analyzeSolid(color: string) {
  const source = makeRaster(Array(100).fill(color), 10);
  return analyzeWallPixels({
    source,
    mask: fullMask(10, 10),
    quality: "ultra",
  });
}

test("clasifica paredes cálidas, frías, neutras y saturadas", () => {
  assert.equal(analyzeSolid("#C8B49A").profile, "warm-light");
  assert.equal(analyzeSolid("#789CC8").profile, "cool-light");
  assert.equal(analyzeSolid("#4B4D50").profile, "neutral-dark");
  assert.equal(analyzeSolid("#E02A22").profile, "saturated");
  assert.equal(
    classifyWallColor({
      averageLuminance: 0.5,
      averageSaturation: 0.2,
      sampleCount: 2,
    }),
    "unknown",
  );
});

test("usa media recortada para reducir valores extremos", () => {
  assert.equal(trimmedMean([0, 10, 10, 10, 10, 100], 0.2), 10);
});

test("calcula saturación y dominante sin dejar que un objeto minoritario domine", () => {
  const colors = [
    ...Array(90).fill("#C8B49A"),
    ...Array(10).fill("#00FF00"),
  ];
  const source = makeRaster(colors, 10);
  const analysis = analyzeWallPixels({
    source,
    mask: fullMask(10, 10),
    quality: "ultra",
  });
  assert.ok(analysis.averageSaturation < 0.4);
  assert.ok((analysis.dominantHue ?? 0) < 90);
  assert.ok(analysis.averageColor.startsWith("#"));
});

test("recomienda neutralización adaptada al perfil", () => {
  const warm = getRecommendedWhiteBaseSettings(analyzeSolid("#C8B49A"));
  const dark = getRecommendedWhiteBaseSettings(analyzeSolid("#4B4D50"));
  const saturated = getRecommendedWhiteBaseSettings(analyzeSolid("#E02A22"));
  assert.ok(warm.warmthCorrection < 0);
  assert.ok(dark.baseBrightness > warm.baseBrightness);
  assert.ok(saturated.saturationReduction >= 90);
});

test("limita todos los parámetros manuales", () => {
  const clamped = clampWhiteBaseSettings({
    ...DEFAULT_WHITE_BASE_SETTINGS,
    neutralizationStrength: 200,
    saturationReduction: -10,
    warmthCorrection: 300,
    baseBrightness: 150,
    baseContrast: -80,
    shadowPreservation: 140,
    texturePreservation: -20,
  });
  assert.equal(clamped.neutralizationStrength, 100);
  assert.equal(clamped.saturationReduction, 0);
  assert.equal(clamped.warmthCorrection, 100);
  assert.equal(clamped.baseContrast, -50);
  assert.equal(clamped.texturePreservation, 0);
});

test("invalida la firma cuando cambia imagen, geometría o refinamiento", () => {
  const image: LoadedImage = {
    name: "room.png",
    size: 100,
    type: "image/png",
    format: "PNG",
    url: "blob:test",
    dimensions: { width: 100, height: 80 },
  };
  const mask: WallMask = {
    id: "wall",
    name: "Pared",
    type: "manual",
    visible: true,
    selected: true,
    opacity: 0.45,
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const initial = createWallAnalysisKey(image, mask);
  assert.notEqual(
    initial,
    createWallAnalysisKey(image, {
      ...mask,
      points: [...mask.points!, { x: 0, y: 80 }],
    }),
  );
  assert.notEqual(initial, createWallAnalysisKey({ ...image, size: 101 }, mask));
  assert.notEqual(
    initial,
    createWallAnalysisKey(image, {
      ...mask,
      refinement: {
        width: 100,
        height: 80,
        addStrokes: [],
        removeStrokes: [{
          id: "stroke",
          mode: "remove",
          size: 10,
          hardness: 1,
          opacity: 1,
          points: [{ x: 20, y: 20 }],
          createdAt: "2026-01-01T00:00:00.000Z",
        }],
      },
    }),
  );
});
