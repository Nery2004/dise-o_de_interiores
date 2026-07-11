import assert from "node:assert/strict";
import test from "node:test";
import { parseProviderTimeout, parseWallAIProvider } from "@/lib/env/envValidation";
import { validateImageDimensions, validateImageUploadMetadata } from "@/lib/images/imageValidation";
import { migrateProject, validateImportedProject } from "@/lib/projects/projectValidation";
import { normalizeExportFilename } from "@/lib/proposals/proposalUtils";
import type { InteriorProject } from "@/types/project";

const baseProject = {
  id: "project-1", name: "Sala", version: 2, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  originalImage: { name: "sala.png", type: "image/png", width: 100, height: 80, size: 100, dataUrl: "data:image/png;base64,AA==" },
  masks: [], activeColor: null, selectedMaskId: null, globalBlendMode: "multiply",
  editorSettings: { zoom: 1, beforeAfterEnabled: false, maskPreviewEnabled: true, brushSize: 40, brushHardness: 0.7, brushOpacity: 1 }, proposals: [],
} satisfies InteriorProject;

test("valida uploads y límites de dimensiones", () => {
  assert.deepEqual(validateImageUploadMetadata({ name: "room.jpg", type: "image/jpeg", size: 1024 }), { valid: true });
  assert.equal(validateImageUploadMetadata({ name: "room.exe", type: "image/jpeg", size: 1024 }).valid, false);
  assert.equal(validateImageUploadMetadata({ name: "room.png", type: "image/png", size: 11 * 1024 * 1024 }).valid, false);
  assert.equal(validateImageDimensions(5_000, 5_000), true);
  assert.equal(validateImageDimensions(5_001, 5_000), false);
});

test("valida importación y migra proyectos v1 a v2", () => {
  assert.equal(validateImportedProject(baseProject).version, 2);
  const legacy = { ...baseProject, version: 1 } as unknown as InteriorProject;
  const migrated = migrateProject(legacy);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.proposals, []);
  assert.throws(() => validateImportedProject({ ...baseProject, originalImage: { ...baseProject.originalImage, width: -1 } }));
});

test("normaliza nombres de exportación", () => {
  assert.equal(normalizeExportFilename("Opción Cálida / Cliente"), "opcion-calida-cliente");
});

test("selecciona proveedores válidos y timeouts seguros", () => {
  assert.equal(parseWallAIProvider(undefined), "mock");
  assert.equal(parseWallAIProvider("roboflow"), "roboflow");
  assert.throws(() => parseWallAIProvider("unknown"));
  assert.equal(parseProviderTimeout("20000"), 20_000);
  assert.equal(parseProviderTimeout("999999"), 15_000);
});
