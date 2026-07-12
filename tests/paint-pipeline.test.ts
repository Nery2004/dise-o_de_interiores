import assert from "node:assert/strict";
import test from "node:test";
import { applyBlendPass } from "@/lib/paint/BlendPass";
import { findMaskBounds } from "@/lib/paint/MaskFeatherPass";
import { processPaintPixel } from "@/lib/paint/PaintPipeline";
import { renderAdaptiveWhiteBase } from "@/lib/paint/whiteBaseRenderer";
import {
  hexToRgbColor,
  oklabToRgb,
  rgbToOklab,
} from "@/lib/colors/colorSpace";
import {
  DEFAULT_PAINT_SETTINGS,
  resolvePaintSettings,
} from "@/lib/paint/paintSettings";
import type { WallMask } from "@/types/editor";
import {
  DEFAULT_WHITE_BASE_SETTINGS,
  resolveEffectiveWhiteBaseSettings,
} from "@/lib/paint/whiteBaseOptimizer";

const effectiveWhiteBase = resolveEffectiveWhiteBaseSettings(
  DEFAULT_WHITE_BASE_SETTINGS,
  null,
  100,
);

test("OKLab conserva el color al convertir ida y vuelta", () => {
  const source = hexToRgbColor("#A8B5A2");
  const roundTrip = oklabToRgb(rgbToOklab(source));
  assert.ok(Math.abs(roundTrip.r - source.r) < 0.00001);
  assert.ok(Math.abs(roundTrip.g - source.g) < 0.00001);
  assert.ok(Math.abs(roundTrip.b - source.b) < 0.00001);
});

test("la base blanca reduce croma sin borrar la luminancia", () => {
  const beige = rgbToOklab(hexToRgbColor("#C7A97D"));
  const primed = renderAdaptiveWhiteBase({
    averageLuminance: beige.l,
    localLuminance: beige.l,
    settings: effectiveWhiteBase,
    source: beige,
  });
  assert.ok(Math.hypot(primed.a, primed.b) < Math.hypot(beige.a, beige.b) * 0.7);
  assert.ok(primed.l > beige.l);
  assert.ok(primed.l - beige.l < 0.08);
});

test("Paint Simulation mantiene la jerarquía entre sombra y luz", () => {
  const settings = { ...DEFAULT_PAINT_SETTINGS, paintIntensity: 150 };
  const target = hexToRgbColor("#A8B5A2");
  const shadow = processPaintPixel({
    averageLuminance: 0.7,
    localLuminance: 0.4,
    settings,
    source: hexToRgbColor("#756A5E"),
    target,
    whiteBaseSettings: effectiveWhiteBase,
  });
  const highlight = processPaintPixel({
    averageLuminance: 0.7,
    localLuminance: 0.95,
    settings,
    source: hexToRgbColor("#F1E7D8"),
    target,
    whiteBaseSettings: effectiveWhiteBase,
  });
  assert.ok(rgbToOklab(highlight).l > rgbToOklab(shadow).l + 0.2);
});

test("intensidad cero en modo directo conserva el píxel sin volverlo transparente", () => {
  const source = hexToRgbColor("#C7A97D");
  const result = processPaintPixel({
    averageLuminance: rgbToOklab(source).l,
    localLuminance: rgbToOklab(source).l,
    settings: {
      ...DEFAULT_PAINT_SETTINGS,
      paintIntensity: 0,
      paintMode: "direct",
    },
    source,
    target: hexToRgbColor("#A8B5A2"),
    whiteBaseSettings: effectiveWhiteBase,
  });
  assert.ok(Math.abs(result.r - source.r) < 0.00001);
  assert.ok(Math.abs(result.g - source.g) < 0.00001);
  assert.ok(Math.abs(result.b - source.b) < 0.00001);
});

test("los blends implementan operaciones distintas y acotadas", () => {
  const backdrop = { r: 0.25, g: 0.5, b: 0.75 };
  const source = { r: 0.8, g: 0.4, b: 0.2 };
  assert.deepEqual(applyBlendPass("multiply", backdrop, source), {
    r: 0.2,
    g: 0.2,
    b: 0.15000000000000002,
  });
  assert.notDeepEqual(
    applyBlendPass("soft-light", backdrop, source),
    applyBlendPass("hard-light", backdrop, source),
  );
});

test("la configuración nueva usa base blanca y Paint Simulation por defecto", () => {
  const mask = {
    id: "wall",
    name: "Pared",
    type: "manual",
    visible: true,
    selected: true,
    opacity: 0.45,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
  } satisfies WallMask;
  const settings = resolvePaintSettings(mask, "paint-simulation");
  assert.equal(settings.paintMode, "white-base");
  assert.equal(settings.primerCoverage, 100);
  assert.equal(settings.blendMode, "paint-simulation");
});

test("el cálculo de bounds limita el procesamiento a la máscara", () => {
  const alpha = new Uint8ClampedArray(6 * 5);
  alpha[2 * 6 + 1] = 255;
  alpha[4 * 6 + 4] = 100;
  assert.deepEqual(findMaskBounds(alpha, 6, 5), {
    x: 1,
    y: 2,
    width: 4,
    height: 3,
  });
});
