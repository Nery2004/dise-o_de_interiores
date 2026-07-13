import assert from "node:assert/strict";
import test from "node:test";
import {
  linearChannelToSrgb,
  mapOklabToSrgb,
  relativeLuminance,
  srgbChannelToLinear,
} from "@/lib/colors/colorManagement";
import { hexToRgbColor, rgbToOklab } from "@/lib/colors/colorSpace";
import { rgbDeltaE } from "@/lib/colors/colorManagement";
import { paintReplacementStrength } from "@/lib/paint/ColorReplacementPass";
import { preserveHighlightLuminance } from "@/lib/paint/HighlightPreservationPass";
import { featherAlphaMask } from "@/lib/paint/featherAlpha";
import { calculateFeatherMetrics } from "@/lib/paint/evaluation/featherMetrics";
import { createPaintPreColorCacheKey } from "@/lib/paint/paintCacheKey";
import { PaintRenderPipeline, type PaintRenderInput } from "@/lib/paint/PaintRenderPipeline";
import { DEFAULT_PAINT_SETTINGS } from "@/lib/paint/paintSettings";
import { DEFAULT_WHITE_BASE_SETTINGS, resolveEffectiveWhiteBaseSettings } from "@/lib/paint/whiteBaseOptimizer";
import { primerCoverageStrength } from "@/lib/paint/whiteBaseRenderer";
import { loadPaintFixtures } from "@/scripts/paint-rendering/benchmark-utils";
import path from "node:path";

const close = (actual: number, expected: number, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test("sRGB lineal y luminancia usan los valores de referencia IEC", () => {
  close(srgbChannelToLinear(0), 0);
  close(srgbChannelToLinear(1), 1);
  close(srgbChannelToLinear(0.04045), 0.0031308049535603713);
  close(linearChannelToSrgb(0.0031308), 0.040449936);
  close(relativeLuminance({ r: 1, g: 0, b: 0 }), 0.2126);
  close(relativeLuminance({ r: 1, g: 1, b: 1 }), 1);
});

test("el gamut mapping conserva matiz y evita canales recortados", () => {
  const source = { l: 0.58, a: 0.42, b: 0.2 };
  const mapped = mapOklabToSrgb(source);
  assert.ok(Object.values(mapped).every((channel) => channel > 0 && channel < 1));
  const mappedLab = rgbToOklab(mapped);
  const sourceHue = Math.atan2(source.b, source.a);
  const mappedHue = Math.atan2(mappedLab.b, mappedLab.a);
  assert.ok(Math.abs(sourceHue - mappedHue) < 0.01);
});

test("la curva de intensidad es progresiva, fuerte al 100 y limitada al 200", () => {
  const values = [0, 25, 50, 75, 100, 150, 200].map(paintReplacementStrength);
  assert.equal(values[0], 0);
  assert.ok(values[2] > 0.5);
  assert.equal(values[4], 0.96);
  assert.equal(values.at(-1), 1);
  values.slice(1).forEach((value, index) => assert.ok(value > values[index]));
});

test("la imprimación tiene anclas independientes 0, 50 y 100", () => {
  assert.equal(primerCoverageStrength(0), 0);
  assert.equal(primerCoverageStrength(50), 0.5);
  assert.equal(primerCoverageStrength(100), 1);
  assert.ok(primerCoverageStrength(25) < 0.25);
  assert.ok(primerCoverageStrength(75) > 0.75);
});

test("el knee de altas luces preserva reflejos pero no una pared clara uniforme", () => {
  const reflection = preserveHighlightLuminance(0.72, 0.98, 90, 0.7);
  const uniformWall = preserveHighlightLuminance(0.72, 0.94, 90, 0.94);
  assert.ok(reflection > 0.9);
  close(uniformWall, 0.72);
});

test("feather 0/5/10/20/40 conserva simetría y aumenta la transición", () => {
  const width = 121;
  const height = 9;
  const binary = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y += 1)
    for (let x = 30; x <= 90; x += 1) binary[y * width + x] = 255;
  let previousTransition = -1;
  for (const feather of [0, 5, 10, 20, 40]) {
    const output = featherAlphaMask(binary, width, height, feather);
    const metrics = calculateFeatherMetrics(output, binary, width, height);
    assert.ok(metrics.symmetryError < 0.001);
    assert.ok(metrics.transitionPixelCount >= previousTransition);
    assert.ok(metrics.discontinuityCount === (feather === 0 ? height * 2 : 0));
    previousTransition = metrics.transitionPixelCount;
  }
});

function tinyInput(maskAlpha = 160): PaintRenderInput {
  const original = hexToRgbColor("#C7A97D");
  const data = new Uint8ClampedArray([
    Math.round(original.r * 255), Math.round(original.g * 255), Math.round(original.b * 255), 255,
  ]);
  return {
    originalImage: { data, width: 1, height: 1 },
    mask: { alpha: new Uint8ClampedArray([maskAlpha]), width: 1, height: 1 },
    targetColor: "#2C6FB7",
    ...DEFAULT_PAINT_SETTINGS,
    quality: "high",
    neutralizationSettings: resolveEffectiveWhiteBaseSettings(DEFAULT_WHITE_BASE_SETTINGS, null, 100),
    shadowPreservation: 90,
    texturePreservation: 90,
  };
}

test("alpha geométrico, intensidad y primer modifican señales diferentes", () => {
  const pipeline = new PaintRenderPipeline();
  const input = tinyInput();
  const base = pipeline.render(input);
  const lowIntensity = pipeline.render({ ...input, paintIntensity: 25 });
  const noPrimer = pipeline.render({
    ...input,
    primerCoverage: 0,
    neutralizationSettings: { ...input.neutralizationSettings, primerCoverage: 0 },
  });
  assert.equal(base.imageData[3], 160);
  assert.equal(lowIntensity.imageData[3], 160);
  assert.equal(noPrimer.imageData[3], 160);
  assert.notDeepEqual(base.imageData.slice(0, 3), lowIntensity.imageData.slice(0, 3));
  assert.notDeepEqual(base.imageData.slice(0, 3), noPrimer.imageData.slice(0, 3));
});

test("una máscara cero no pinta y una cancelación previa aborta", () => {
  const pipeline = new PaintRenderPipeline();
  assert.deepEqual([...pipeline.render(tinyInput(0)).imageData], [0, 0, 0, 0]);
  const controller = new AbortController();
  controller.abort();
  assert.throws(() => pipeline.render({ ...tinyInput(), signal: controller.signal }), { name: "AbortError" });
});

test("la clave precromática es estable, versionada y no depende del target", () => {
  const first = createPaintPreColorCacheKey({ imageHash: "image", maskVersion: "2", quality: "high", feather: 4, neutralizationSettings: { b: 2, a: 1 } });
  const reordered = createPaintPreColorCacheKey({ imageHash: "image", maskVersion: "2", quality: "high", feather: 4, neutralizationSettings: { a: 1, b: 2 } });
  const changed = createPaintPreColorCacheKey({ imageHash: "image", maskVersion: "3", quality: "high", feather: 4, neutralizationSettings: { a: 1, b: 2 } });
  assert.equal(first, reordered);
  assert.notEqual(first, changed);
  assert.match(first, /pipelineVersion/);
  assert.doesNotMatch(first, /targetColor/);
});

test("cobertura fuerte reduce el error respecto al target en pared beige", () => {
  const pipeline = new PaintRenderPipeline();
  const input = tinyInput(255);
  const weak = pipeline.render({ ...input, paintIntensity: 25 }).imageData;
  const strong = pipeline.render({ ...input, paintIntensity: 100 }).imageData;
  const target = hexToRgbColor(input.targetColor);
  const read = (data: Uint8ClampedArray) => ({ r: data[0] / 255, g: data[1] / 255, b: data[2] / 255 });
  assert.ok(rgbDeltaE(read(strong), target) < rgbDeltaE(read(weak), target));
});

test("el dataset incluye los 12 casos controlados con máscaras binarias", async () => {
  const fixtures = await loadPaintFixtures(path.join(process.cwd(), "tests/fixtures/paint-rendering"));
  assert.equal(fixtures.length, 12);
  assert.ok(fixtures.every((fixture) => fixture.metadata.synthetic));
  assert.ok(fixtures.every((fixture) => fixture.original.length === fixture.metadata.width * fixture.metadata.height * 4));
  assert.ok(fixtures.every((fixture) => fixture.binaryMask.every((value) => value === 0 || value === 255)));
});
