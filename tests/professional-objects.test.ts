import assert from "node:assert/strict";
import test from "node:test";
import { decorObjects } from "@/data/decorObjects";
import { alignObjects, distributeObjects, getSmartGuides } from "@/lib/decor/alignmentSystem";
import { lightingDefaults } from "@/lib/lighting/lightProfile";
import { replacePlacedObjectAsset } from "@/lib/decor/objectReplacement";
import { getObjectStatistics } from "@/lib/decor/objectStatistics";
import { decorCollectionIds, premiumDecorCategories } from "@/types/decor-object";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

function placed(id: string, x: number, y: number, width = 100, height = 80): PlacedDecorObject {
  const asset = decorObjects[0];
  return { id, decorObjectId: asset.id, name: asset.name, assetUrl: asset.assetUrl, assetType: asset.assetType, originalWidth: 800, originalHeight: 800, x, y, width, height, scaleX: width / 800, scaleY: height / 800, rotation: 0, opacity: 1, visible: true, locked: false, selected: true, zIndex: 0, flipX: false, flipY: false, lockAspectRatio: true, surfaceType: "floor", anchor: "bottom-center", depth: 0.5, perspectiveMode: "none", autoScaleByDepth: true, baseContactOffset: 0, zOrderMode: "depth", ...lightingDefaults(asset.category, "floor"), createdAt: "2026-01-01", updatedAt: "2026-01-01" };
}

test("el catálogo profesional declara categorías, colecciones, medidas y variantes", () => {
  assert.equal(premiumDecorCategories.length, 24);
  assert.equal(decorCollectionIds.length, 11);
  assert.ok(decorObjects.every((object) => premiumDecorCategories.includes(object.catalogCategory)));
  assert.ok(decorObjects.every((object) => object.collectionIds.length > 0 && object.approximateWidthCm > 0));
  assert.ok(decorObjects.every((object) => (object.variants?.length ?? 0) > 0));
});

test("alineación, igualado y distribución conservan objetos válidos", () => {
  const objects = [placed("a", 50, 60, 80), placed("b", 180, 120, 120), placed("c", 350, 200, 90)];
  const aligned = alignObjects(objects, "left");
  assert.ok(aligned.every((object) => Math.abs(object.x - object.width / 2 - 10) < 0.001));
  const sameHeight = alignObjects(objects, "same-height");
  assert.ok(sameHeight.every((object) => object.height === objects[0].height));
  const distributed = distributeObjects(objects, "horizontal");
  assert.equal(distributed[1].x - distributed[0].x, distributed[2].x - distributed[1].x);
});

test("las guías detectan centros y alturas cercanas", () => {
  const moving = placed("a", 100, 100);
  const guides = getSmartGuides(moving, [moving, placed("b", 103, 150)]);
  assert.ok(guides.some((guide) => guide.axis === "x"));
});

test("reemplazar conserva transformación, perspectiva e iluminación", () => {
  const source = placed("a", 100, 120);
  source.rotation = 24;
  source.temperature = 18;
  source.depth = 0.7;
  const replacement = decorObjects[5];
  const result = replacePlacedObjectAsset(source, replacement);
  assert.equal(result.decorObjectId, replacement.id);
  assert.equal(result.x, source.x);
  assert.equal(result.rotation, 24);
  assert.equal(result.temperature, 18);
  assert.equal(result.depth, 0.7);
});

test("estadísticas contabilizan grupos, visibilidad, bloqueo y colores", () => {
  const first = placed("a", 0, 0);
  const second = { ...placed("b", 100, 0), visible: false, locked: true };
  const stats = getObjectStatistics([first, second], [{ id: "g", name: "Grupo", objectIds: ["a", "b"], visible: true, locked: false, tags: [], createdAt: "x", updatedAt: "x" }]);
  assert.equal(stats.objectCount, 2);
  assert.equal(stats.groupCount, 1);
  assert.equal(stats.hiddenCount, 1);
  assert.equal(stats.lockedCount, 1);
  assert.ok(stats.predominantColors.length > 0);
});
