import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFitScale,
  clampTranslation,
  clampZoom,
  getComparisonClipPath,
  imagePointToScreenPoint,
  screenPointToImagePoint,
  type CanvasTransform,
} from "@/lib/canvas/canvasTransformUtils";

test("calculateFitScale aplica contain con margen sin deformar", () => {
  assert.equal(
    calculateFitScale(
      { width: 1000, height: 700 },
      { width: 1600, height: 900 },
      50,
    ),
    0.5625,
  );
  assert.equal(
    calculateFitScale(
      { width: 700, height: 1000 },
      { width: 1600, height: 900 },
      50,
    ),
    0.375,
  );
});

test("el zoom nunca baja del fit ni supera 400 %", () => {
  assert.equal(clampZoom(0.1, 0.4), 0.4);
  assert.equal(clampZoom(2, 0.4), 2);
  assert.equal(clampZoom(8, 0.4), 4);
});

test("clampTranslation mantiene parte de la imagen visible", () => {
  const clamped = clampTranslation(
    { scale: 1, translateX: 10_000, translateY: -10_000 },
    { width: 800, height: 600 },
    { width: 1000, height: 500 },
  );
  assert.deepEqual(clamped, {
    scale: 1,
    translateX: 836,
    translateY: -486,
  });
});

test("los clips vertical y horizontal comparten el mismo cálculo", () => {
  assert.equal(getComparisonClipPath("vertical", 30), "inset(0 70% 0 0)");
  assert.equal(getComparisonClipPath("horizontal", 30), "inset(0 0 70% 0)");
  assert.equal(getComparisonClipPath("vertical", 130), "inset(0 0% 0 0)");
});

test("las conversiones pantalla-imagen son inversas con una transformación única", () => {
  const transform: CanvasTransform = {
    scale: 1.75,
    translateX: 42,
    translateY: -18,
  };
  const viewport = { width: 1200, height: 800 };
  const image = { width: 1600, height: 900 };
  const imagePoint = { x: 315, y: 712 };
  const screenPoint = imagePointToScreenPoint(
    imagePoint,
    viewport,
    image,
    transform,
  );
  const roundTrip = screenPointToImagePoint(
    screenPoint,
    viewport,
    image,
    transform,
  );

  assert.ok(Math.abs(roundTrip.x - imagePoint.x) < 0.000001);
  assert.ok(Math.abs(roundTrip.y - imagePoint.y) < 0.000001);
});
