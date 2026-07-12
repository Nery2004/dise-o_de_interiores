import assert from "node:assert/strict";
import test from "node:test";
import { decorObjects } from "@/data/decorObjects";
import {
  getPerspectiveScale,
  sortObjectsByDepth,
} from "@/lib/perspective/depthScale";
import {
  centerFromAnchor,
  defaultPlacementForCategory,
  depthAtPoint,
  findSurfaceAtPoint,
  fitObjectToSurface,
  objectAnchorPoint,
  rectanglePerspectivePoints,
} from "@/lib/perspective/objectAnchoring";
import {
  computeProjectiveMatrix,
  mapProjectivePoint,
} from "@/lib/perspective/projectiveTransform";
import { validatePerspectivePoints } from "@/lib/perspective/perspectiveValidation";
import {
  createHeuristicSurfaces,
  distanceToPolygon,
  pointInPolygon,
  polygonBounds,
} from "@/lib/perspective/surfaceGeometry";
import { validateImportedProject } from "@/lib/projects/projectValidation";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PlacementSurface } from "@/types/perspective";
import { lightingDefaults } from "@/lib/lighting/lightProfile";

const now = "2026-07-12T00:00:00.000Z";

function surface(changes: Partial<PlacementSurface> = {}): PlacementSurface {
  return {
    id: "floor-1",
    name: "Piso",
    type: "floor",
    points: [
      { x: 20, y: 50 },
      { x: 180, y: 50 },
      { x: 200, y: 150 },
      { x: 0, y: 150 },
    ],
    visible: true,
    locked: false,
    selected: false,
    detected: false,
    snapEnabled: true,
    createdAt: now,
    updatedAt: now,
    ...changes,
  };
}

function placed(changes: Partial<PlacedDecorObject> = {}): PlacedDecorObject {
  const asset = decorObjects.find((object) => object.category === "alfombras")!;
  return {
    id: "object-1",
    decorObjectId: asset.id,
    name: asset.name,
    assetUrl: asset.assetUrl,
    assetType: asset.assetType,
    originalWidth: asset.width,
    originalHeight: asset.height,
    x: 100,
    y: 100,
    width: 100,
    height: 60,
    scaleX: 100 / asset.width,
    scaleY: 60 / asset.height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    selected: false,
    zIndex: 0,
    flipX: false,
    flipY: false,
    lockAspectRatio: true,
    surfaceType: "floor",
    anchor: "bottom-center",
    depth: 0.5,
    perspectiveMode: "surface",
    surfaceId: "floor-1",
    autoScaleByDepth: true,
    baseContactOffset: 0,
    zOrderMode: "depth",
    ...lightingDefaults(asset.category, "floor"),
    createdAt: now,
    updatedAt: now,
    ...changes,
  };
}

test("las superficies usan coordenadas reales para hit testing, tolerancia y límites", () => {
  const item = surface();
  assert.equal(pointInPolygon({ x: 100, y: 100 }, item.points), true);
  assert.equal(pointInPolygon({ x: 100, y: 20 }, item.points), false);
  assert.equal(distanceToPolygon({ x: 100, y: 45 }, item.points), 5);
  assert.deepEqual(polygonBounds(item.points), {
    left: 0,
    top: 50,
    right: 200,
    bottom: 150,
    width: 200,
    height: 100,
  });
  assert.equal(
    findSurfaceAtPoint([item], { x: 100, y: 45 }, "floor", 6)?.id,
    item.id,
  );
  assert.equal(
    findSurfaceAtPoint([item], { x: 100, y: 45 }, "wall", 6),
    undefined,
  );
});

test("la detección heurística produce pared y piso válidos dentro de la imagen", () => {
  const surfaces = createHeuristicSurfaces({ width: 1600, height: 900 });
  assert.deepEqual(
    surfaces.map((item) => item.type),
    ["wall", "floor"],
  );
  assert.ok(
    surfaces.every(
      (item) =>
        item.detected &&
        item.points.every(
          (point) =>
            point.x >= 0 && point.x <= 1600 && point.y >= 0 && point.y <= 900,
        ),
    ),
  );
});

test("categorías reciben superficie, ancla y autoescala apropiadas", () => {
  assert.deepEqual(defaultPlacementForCategory("alfombras"), {
    surfaceType: "floor",
    anchor: "bottom-center",
    autoScaleByDepth: true,
  });
  assert.deepEqual(defaultPlacementForCategory("cuadros"), {
    surfaceType: "wall",
    anchor: "center",
    autoScaleByDepth: false,
  });
  assert.equal(defaultPlacementForCategory("lamparas").anchor, "top-center");
});

test("ancla y centro son operaciones inversas y la profundidad queda normalizada", () => {
  const center = centerFromAnchor({ x: 80, y: 140 }, 60, "bottom-center", 5);
  assert.deepEqual(center, { x: 80, y: 105 });
  assert.deepEqual(
    objectAnchorPoint(
      placed({ x: center.x, y: center.y, height: 60, baseContactOffset: 5 }),
    ),
    { x: 80, y: 140 },
  );
  assert.equal(
    depthAtPoint(surface(), { x: 100, y: 100 }, { width: 200, height: 150 }),
    0.5,
  );
});

test("la escala crece suavemente con profundidad y el orden automático la respeta", () => {
  assert.ok(
    getPerspectiveScale(0.85, "sillones") >
      getPerspectiveScale(0.15, "sillones"),
  );
  const ordered = sortObjectsByDepth([
    placed({ id: "near", depth: 0.9, zIndex: 0 }),
    placed({ id: "far", depth: 0.1, zIndex: 1 }),
  ]);
  assert.deepEqual(
    ordered.map((object) => object.id),
    ["far", "near"],
  );
  assert.deepEqual(
    ordered.map((object) => object.zIndex),
    [0, 1],
  );
});

test("alfombras ajustadas al piso forman un cuadrilátero convexo", () => {
  const points = fitObjectToSurface(placed(), surface());
  assert.equal(validatePerspectivePoints(points), true);
  assert.ok(points.bottomLeft.y > points.topLeft.y);
  assert.ok(
    points.bottomRight.x - points.bottomLeft.x >
      points.topRight.x - points.topLeft.x,
  );
  assert.equal(
    validatePerspectivePoints({ ...points, topLeft: points.bottomRight }),
    false,
  );
});

test("la homografía lleva exactamente las cuatro esquinas a su destino", () => {
  const points = {
    topLeft: { x: 10, y: 20 },
    topRight: { x: 160, y: 10 },
    bottomRight: { x: 180, y: 130 },
    bottomLeft: { x: 0, y: 110 },
  };
  const matrix = computeProjectiveMatrix(100, 80, points)!;
  const mapped = [
    mapProjectivePoint(matrix, { x: 0, y: 0 }),
    mapProjectivePoint(matrix, { x: 100, y: 0 }),
    mapProjectivePoint(matrix, { x: 100, y: 80 }),
    mapProjectivePoint(matrix, { x: 0, y: 80 }),
  ];
  const expected = [
    points.topLeft,
    points.topRight,
    points.bottomRight,
    points.bottomLeft,
  ];
  mapped.forEach((point, index) => {
    assert.ok(Math.abs(point.x - expected[index].x) < 1e-6);
    assert.ok(Math.abs(point.y - expected[index].y) < 1e-6);
  });
  assert.equal(
    validatePerspectivePoints(rectanglePerspectivePoints(placed())),
    true,
  );
});

test("un proyecto v4 conserva objetos al migrar y añade perspectiva segura", () => {
  const legacyObject = placed() as unknown as Record<string, unknown>;
  for (const key of [
    "surfaceType",
    "anchor",
    "depth",
    "perspectiveMode",
    "surfaceId",
    "autoScaleByDepth",
    "baseContactOffset",
    "zOrderMode",
  ])
    delete legacyObject[key];
  const project = {
    id: "legacy-v4",
    name: "Sala",
    version: 4,
    createdAt: now,
    updatedAt: now,
    originalImage: {
      name: "room.png",
      type: "image/png",
      width: 200,
      height: 150,
      size: 20,
      dataUrl: "data:image/png;base64,AA==",
    },
    masks: [],
    placedObjects: [legacyObject],
    placementSurfaces: undefined,
    perspectiveGuide: undefined,
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
    proposals: [],
  };
  const migrated = validateImportedProject(project);
  assert.equal(migrated.version, 7);
  assert.equal(migrated.placedObjects.length, 1);
  assert.equal(migrated.placedObjects[0].perspectiveMode, "none");
  assert.equal(migrated.placedObjects[0].zOrderMode, "manual");
  assert.deepEqual(migrated.placementSurfaces, []);
});
