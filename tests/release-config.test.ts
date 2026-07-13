import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { APP_RELEASE_CHANNEL, APP_VERSION } from "@/config/app";
import { FeatureFlags, parseFeatureFlag } from "@/config/featureFlags";
import {
  DECOR_RENDER_PIPELINE_VERSION,
  objectRenderCacheKey,
} from "@/lib/lighting/DecorObjectRenderPipeline";
import { PAINT_PIPELINE_VERSION } from "@/lib/paint/pipelineVersion";
import { importProjectFile } from "@/lib/projects/projectImportExport";
import { validateImportedProject } from "@/lib/projects/projectValidation";
import { WALL_DETECTION_PIPELINE_VERSION } from "@/lib/wallDetection/pipeline/version";
import { resolveRequestedDetectionMode } from "@/lib/wallDetection/providerSelection";
import {
  CURRENT_PROJECT_VERSION,
  LATEST_PROJECT_VERSION,
  PROJECT_SCHEMA_VERSION,
} from "@/types/project";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

test("la versión del RC coincide entre configuración, paquete y canal", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    version: string;
  };
  assert.equal(APP_VERSION, "0.9.0-rc.1");
  assert.equal(packageJson.version, APP_VERSION);
  assert.equal(APP_RELEASE_CHANNEL, "release-candidate");
});

test("los flags interpretan valores explícitos y conservan defaults seguros", () => {
  assert.equal(parseFeatureFlag("true", false), true);
  assert.equal(parseFeatureFlag("OFF", true), false);
  assert.equal(parseFeatureFlag("desconocido", false), false);
  assert.equal(parseFeatureFlag(undefined, false), false);
  assert.equal(parseFeatureFlag(undefined, true), true);
  assert.equal(FeatureFlags.objectOcclusion, false);
});

test("la selección de provider falla cerrada y usa mock sin flag externo", () => {
  assert.equal(resolveRequestedDetectionMode(null, false), "mock");
  assert.equal(resolveRequestedDetectionMode(null, true), "ai");
  assert.equal(resolveRequestedDetectionMode("mock", false), "mock");
  assert.equal(resolveRequestedDetectionMode("ai", false), "ai");
  assert.equal(resolveRequestedDetectionMode("replicate", false), null);
});

test("los esquemas y pipelines usados por caché están versionados", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 7);
  assert.equal(LATEST_PROJECT_VERSION, PROJECT_SCHEMA_VERSION);
  assert.equal(CURRENT_PROJECT_VERSION, PROJECT_SCHEMA_VERSION);
  assert.match(WALL_DETECTION_PIPELINE_VERSION, /^\d+\.\d+\.\d+$/);
  assert.match(PAINT_PIPELINE_VERSION, /^\d+\.\d+\.\d+$/);
  assert.match(DECOR_RENDER_PIPELINE_VERSION, /^\d+\.\d+\.\d+$/);

  const key = objectRenderCacheKey(
    {
      assetUrl: "/decor/fixture.webp",
      width: 10,
      height: 10,
      flipX: false,
      flipY: false,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      sharpness: 0,
      depthBlur: 0,
      grain: 0,
    } as PlacedDecorObject,
    "high",
  );
  assert.match(key, new RegExp(DECOR_RENDER_PIPELINE_VERSION.replaceAll(".", "\\.")));
});

test("el fixture final conserva una edición completa y portable", async () => {
  const source = JSON.parse(
    await readFile("tests/fixtures/release-candidate-project.json", "utf8"),
  ) as unknown;
  const before = JSON.stringify(source);
  const project = validateImportedProject(source);

  assert.equal(project.version, PROJECT_SCHEMA_VERSION);
  assert.match(project.originalImage.dataUrl ?? "", /^data:image\/webp;base64,/);
  assert.equal(project.masks[0].paintMode, "white-base");
  assert.equal(project.masks[0].color, "#A8B5A2");
  assert.equal(project.masks[0].whiteBaseSettings?.profile, "neutral-light");
  assert.equal(project.placedObjects[0].perspectiveMode, "free-transform");
  assert.equal(project.placedObjects[0].shadowSettings?.type, "both");
  assert.equal(project.placedObjects[0].surfaceId, project.placementSurfaces[0].id);
  assert.equal(project.placedObjects[0].lightProfileId, project.activeRoomLightProfileId);
  assert.equal(project.proposals[0].placedObjectsSnapshot.length, 1);
  assert.equal(project.proposals[0].masksSnapshot[0].paintMode, "white-base");
  assert.equal(JSON.stringify(source), before);

  const imported = await importProjectFile(
    new File(
      [before],
      "release-candidate-project.interior-project.json",
      { type: "application/json" },
    ),
  );
  assert.equal(imported.originalImageBlob.type, "image/webp");
  assert.equal(imported.originalImage.dataUrl, undefined);
  assert.equal(imported.proposals[0].placedObjectsSnapshot[0].shadowSettings?.enabled, true);
});
