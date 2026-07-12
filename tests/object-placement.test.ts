import assert from "node:assert/strict";
import test from "node:test";
import { decorObjects } from "@/data/decorObjects";
import {
  clampObjectToImage,
  clientPointToImagePoint,
  getInitialObjectSize,
  getObjectBounds,
  getRotatedObjectBounds,
  normalizeObjectZIndexes,
  resizeObjectFromHandle,
  rotateObjectFromPointer,
} from "@/lib/decor/objectPlacementGeometry";
import { clonePlacedDecorObjects } from "@/lib/proposals/proposalUtils";
import {
  migrateProject,
  validateImportedProject,
} from "@/lib/projects/projectValidation";
import { loadDecorAsset } from "@/lib/decor/loadDecorAsset";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { InteriorProject } from "@/types/project";

function placed(changes: Partial<PlacedDecorObject> = {}): PlacedDecorObject {
  return {
    id: "placed-1",
    decorObjectId: decorObjects[0].id,
    name: "Sillón",
    assetUrl: decorObjects[0].assetUrl,
    assetType: "webp",
    originalWidth: 800,
    originalHeight: 800,
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    scaleX: 0.125,
    scaleY: 0.125,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    selected: true,
    zIndex: 0,
    flipX: false,
    flipY: false,
    lockAspectRatio: true,
    surfaceType: "free",
    anchor: "center",
    depth: 0.5,
    perspectiveMode: "none",
    autoScaleByDepth: false,
    baseContactOffset: 0,
    zOrderMode: "manual",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    ...changes,
  };
}

test("el tamaño inicial depende de categoría, asset e imagen", () => {
  const sofa = decorObjects.find((object) => object.category === "sillones")!;
  const pot = decorObjects.find((object) => object.category === "macetas")!;
  const image = { width: 1600, height: 1000 };
  const sofaSize = getInitialObjectSize(sofa, image);
  const potSize = getInitialObjectSize(pot, image);
  assert.ok(sofaSize.width > potSize.width * 2);
  assert.ok(
    sofaSize.width <= image.width * 0.78 &&
      sofaSize.height <= image.height * 0.78,
  );
  assert.equal(sofaSize.width / sofaSize.height, sofa.width / sofa.height);
});

test("bounds, rotación y clamp usan coordenadas reales de imagen", () => {
  assert.deepEqual(getObjectBounds(placed()), {
    left: 50,
    top: 50,
    right: 150,
    bottom: 150,
    width: 100,
    height: 100,
  });
  const rotated = getRotatedObjectBounds(
    placed({ width: 120, height: 60, rotation: 90 }),
  );
  assert.ok(Math.abs(rotated.width - 60) < 0.001);
  assert.ok(Math.abs(rotated.height - 120) < 0.001);
  const clamped = clampObjectToImage(placed({ x: -20, y: 220 }), {
    width: 300,
    height: 200,
  });
  const bounds = getRotatedObjectBounds(clamped);
  assert.ok(
    bounds.left >= 0 &&
      bounds.top >= 0 &&
      bounds.right <= 300 &&
      bounds.bottom <= 200,
  );
});

test("convierte puntos del canvas mostrado al sistema real de la imagen", () => {
  assert.deepEqual(
    clientPointToImagePoint(
      { x: 250, y: 150 },
      { left: 50, top: 50, width: 400, height: 200 },
      { width: 1600, height: 800 },
    ),
    { x: 800, y: 400 },
  );
});

test("resize desde esquina mantiene proporción, tamaño positivo y límites", () => {
  const resized = resizeObjectFromHandle(
    placed(),
    "south-east",
    { x: 210, y: 190 },
    { width: 400, height: 300 },
    true,
  );
  assert.ok(resized.width > 100 && resized.height > 100);
  assert.ok(Math.abs(resized.width / resized.height - 1) < 0.001);
  assert.equal(resized.scaleX, resized.width / resized.originalWidth);
  assert.ok(getRotatedObjectBounds(resized).right <= 400);
});

test("rotación libre y snapping de 15 grados giran alrededor del centro", () => {
  const object = placed();
  assert.equal(
    rotateObjectFromPointer(
      object,
      { x: 100, y: 50 },
      { x: 150, y: 100 },
      false,
    ),
    90,
  );
  const snapped = rotateObjectFromPointer(
    object,
    { x: 100, y: 50 },
    { x: 148, y: 87 },
    true,
  );
  assert.equal(snapped % 15, 0);
});

test("normaliza z-index sin duplicados y conserva el orden visual", () => {
  const objects = normalizeObjectZIndexes([
    placed({ id: "top", zIndex: 8 }),
    placed({ id: "back", zIndex: 2 }),
    placed({ id: "middle", zIndex: 5 }),
  ]);
  assert.deepEqual(
    objects.map((object) => object.id),
    ["back", "middle", "top"],
  );
  assert.deepEqual(
    objects.map((object) => object.zIndex),
    [0, 1, 2],
  );
});

test("snapshots de propuestas clonan objetos y eliminan selección temporal", () => {
  const source = [placed()];
  const snapshot = clonePlacedDecorObjects(source);
  assert.notEqual(snapshot[0], source[0]);
  assert.equal(snapshot[0].selected, false);
  snapshot[0].x = 999;
  assert.equal(source[0].x, 100);
});

test("proyectos v3 migran objetos vacíos y v4 valida objetos colocados", () => {
  const legacy = {
    id: "legacy",
    name: "Anterior",
    version: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    originalImage: {
      name: "room.png",
      type: "image/png",
      width: 400,
      height: 300,
      size: 100,
      dataUrl: "data:image/png;base64,AA==",
    },
    masks: [],
    activeColor: null,
    selectedMaskId: null,
    globalBlendMode: "multiply",
    editorSettings: {
      zoom: 1,
      beforeAfterEnabled: false,
      maskPreviewEnabled: true,
      brushSize: 40,
      brushHardness: 0.7,
      brushOpacity: 1,
    },
    proposals: [
      {
        id: "proposal",
        name: "P1",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        masksSnapshot: [],
      },
    ],
  } as unknown as InteriorProject;
  const migrated = migrateProject(legacy);
  assert.equal(migrated.version, 5);
  assert.deepEqual(migrated.placedObjects, []);
  assert.deepEqual(migrated.proposals[0].placedObjectsSnapshot, []);
  const current = { ...migrated, placedObjects: [placed({ x: 200, y: 150 })] };
  assert.doesNotThrow(() => validateImportedProject(current));
  assert.throws(() =>
    validateImportedProject({
      ...current,
      placedObjects: [{ ...current.placedObjects[0], opacity: 2 }],
    }),
  );
});

test("el cargador rechaza assets remotos o formatos no permitidos", async () => {
  await assert.rejects(loadDecorAsset("https://example.com/object.webp"));
  await assert.rejects(loadDecorAsset("/decor/sofas/object.svg"));
});
