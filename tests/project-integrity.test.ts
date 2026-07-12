import assert from "node:assert/strict";
import test from "node:test";
import { decorObjects } from "@/data/decorObjects";
import { lightingDefaults } from "@/lib/lighting/lightProfile";
import {
  migrateProject,
  migrateProjectToLatestVersion,
} from "@/lib/projects/projectValidation";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { InteriorProject } from "@/types/project";

const now = "2026-07-12T00:00:00.000Z";

function object(id: string, changes: Partial<PlacedDecorObject> = {}): PlacedDecorObject {
  return {
    id,
    decorObjectId: decorObjects[0].id,
    name: `Objeto ${id}`,
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
    selected: false,
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
    ...lightingDefaults("sillones", "free"),
    createdAt: now,
    updatedAt: now,
    ...changes,
  };
}

function project(changes: Partial<InteriorProject> = {}): InteriorProject {
  return {
    id: "project-integrity",
    name: "Integridad",
    version: 7,
    createdAt: now,
    updatedAt: now,
    originalImage: {
      name: "room.png",
      type: "image/png",
      width: 400,
      height: 300,
      size: 100,
      dataUrl: "data:image/png;base64,AA==",
    },
    masks: [],
    placedObjects: [],
    objectGroups: [],
    objectFolders: [],
    favoriteObjectIds: [],
    placementSurfaces: [],
    perspectiveGuide: null,
    roomLightProfiles: [],
    activeColor: null,
    selectedMaskId: null,
    globalBlendMode: "paint-simulation",
    editorSettings: {
      zoom: 1,
      beforeAfterEnabled: false,
      maskPreviewEnabled: true,
      brushSize: 40,
      brushHardness: 0.7,
      brushOpacity: 1,
    },
    proposals: [],
    ...changes,
  };
}

test("las migraciones recorren cada versión sin mutar el proyecto de entrada", () => {
  const legacy = project({ version: 1 }) as InteriorProject;
  const before = JSON.stringify(legacy);
  const migrated = migrateProjectToLatestVersion(legacy);
  assert.equal(migrated.version, 7);
  assert.deepEqual(migrated.placedObjects, []);
  assert.deepEqual(migrated.roomLightProfiles, []);
  assert.deepEqual(migrated.objectGroups, []);
  assert.deepEqual(migrated.favoriteObjectIds, []);
  assert.equal(JSON.stringify(legacy), before);
  assert.throws(() => migrateProjectToLatestVersion(project({ version: 99 })));
});

test("la carga sanea referencias recuperables y conserva datos estructuralmente válidos", () => {
  const first = object("first", {
    groupId: "incorrecto",
    surfaceId: "missing-surface",
    lightProfileId: "missing-light",
  });
  const second = object("second");
  const third = object("third", { groupId: "dangling" });
  const input = project({
    activeRoomLightProfileId: "missing-light",
    selectedMaskId: "missing-mask",
    placedObjects: [first, second, third],
    objectGroups: [{
      id: "group-1",
      name: "Grupo",
      objectIds: ["first", "second", "missing", "first"],
      visible: true,
      locked: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    }],
  });
  const before = JSON.stringify(input);
  const result = migrateProject(input);
  assert.equal(result.selectedMaskId, null);
  assert.equal(result.activeRoomLightProfileId, undefined);
  assert.deepEqual(result.objectGroups[0].objectIds, ["first", "second"]);
  assert.equal(result.placedObjects[0].groupId, "group-1");
  assert.equal(result.placedObjects[1].groupId, "group-1");
  assert.equal(result.placedObjects[2].groupId, undefined);
  assert.equal(result.placedObjects[0].surfaceId, undefined);
  assert.equal(result.placedObjects[0].lightProfileId, undefined);
  assert.equal(JSON.stringify(input), before);
});
