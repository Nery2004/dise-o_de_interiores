import assert from "node:assert/strict";
import test from "node:test";
import { decorObjects } from "@/data/decorObjects";
import { applyObjectColorAdjustments } from "@/lib/lighting/colorAdjustment";
import { createContactShadow } from "@/lib/lighting/contactShadow";
import { objectRenderCacheKey } from "@/lib/lighting/DecorObjectRenderPipeline";
import { lightingDefaults, normalizeDirection } from "@/lib/lighting/lightProfile";
import { calculateDepthBlur } from "@/lib/lighting/objectLightMatcher";
import { createProjectedShadow } from "@/lib/lighting/projectedShadow";
import { estimateLightDirection, estimateRoomTemperature, sampleLighting } from "@/lib/lighting/roomLightAnalyzer";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

function pixels(width: number, height: number, fill: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4;
    const [r, g, b] = fill(x, y);
    data.set([r, g, b, 255], offset);
  }
  return { width, height, data };
}

function placed(): PlacedDecorObject {
  const asset = decorObjects[0];
  return {
    id: "light-object", decorObjectId: asset.id, name: asset.name, assetUrl: asset.assetUrl,
    assetType: asset.assetType, originalWidth: 800, originalHeight: 800, x: 200, y: 180,
    width: 160, height: 120, scaleX: 0.2, scaleY: 0.15, rotation: 0, opacity: 1,
    visible: true, locked: false, selected: false, zIndex: 0, flipX: false, flipY: false,
    lockAspectRatio: true, surfaceType: "floor", anchor: "bottom-center", depth: 0.5,
    perspectiveMode: "none", autoScaleByDepth: true, baseContactOffset: 0, zOrderMode: "depth",
    ...lightingDefaults(asset.category, "floor"), createdAt: "2026-01-01", updatedAt: "2026-01-01",
  };
}

test("normaliza direcciones y usa fallback para el vector cero", () => {
  assert.deepEqual(normalizeDirection({ x: 0, y: 0 }), { x: 0, y: 1 });
  const direction = normalizeDirection({ x: 3, y: 4 });
  assert.ok(Math.abs(direction.x - 0.6) < 0.001 && Math.abs(direction.y - 0.8) < 0.001);
});

test("estima que una fuente clara a la izquierda proyecta hacia la derecha", () => {
  const source = pixels(80, 40, (x) => x < 18 ? [245, 240, 230] : [65, 65, 65]);
  const direction = estimateLightDirection(source);
  assert.ok(direction.x > 0.7);
});

test("estima temperatura y el muestreo recortado ignora extremos", () => {
  const warm = pixels(20, 20, (x, y) => x === 0 && y === 0 ? [255, 255, 255] : [185, 130, 85]);
  assert.ok(estimateRoomTemperature(warm) > 20);
  const sample = sampleLighting(warm);
  assert.ok(sample.luminance > 0.35 && sample.luminance < 0.75);
  assert.ok(sample.validPixelRatio > 0.5);
});

test("limita los ajustes de color sin destruir alfa", () => {
  const data = new Uint8ClampedArray([120, 100, 80, 127]);
  const image = { width: 1, height: 1, data } as ImageData;
  applyObjectColorAdjustments(image, { brightness: 1000, contrast: -1000, saturation: 1000, temperature: 1000, tint: -1000, exposure: 1000, highlights: 1000, shadows: -1000, sharpness: 0, depthBlur: 0, grain: 0 });
  assert.equal(data[3], 127);
  assert.ok(data.slice(0, 3).every((value) => value >= 0 && value <= 255));
});

test("crea sombras de contacto contenidas y una proyectada basada en dirección", () => {
  const object = placed();
  const contact = createContactShadow(object);
  const projected = createProjectedShadow(object, undefined, {
    id: "profile", name: "Luz", mode: "manual", direction: { x: 1, y: 0 }, elevation: 55,
    intensity: 50, temperature: 0, ambientBrightness: 0, ambientContrast: 0,
    shadowStrength: 50, shadowSoftness: 60, sourceType: "window", createdAt: "x", updatedAt: "x",
  });
  assert.ok(contact && contact.width > 0 && contact.width <= object.width * 1.25);
  assert.ok(projected && projected.offsetX > 0 && Math.abs(projected.offsetY) < 0.001);
});

test("el blur de profundidad es sutil y la caché cambia con los ajustes", () => {
  assert.ok(calculateDepthBlur(0.1, 0.2) > calculateDepthBlur(0.9, 0.2));
  assert.ok(calculateDepthBlur(0, 0) <= 3.5);
  const object = placed();
  assert.notEqual(objectRenderCacheKey(object, "high"), objectRenderCacheKey({ ...object, temperature: 12 }, "high"));
});
