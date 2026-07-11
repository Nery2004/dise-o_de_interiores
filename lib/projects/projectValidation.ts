import type { BlendMode, WallMask } from "@/types/editor";
import { CURRENT_PROJECT_VERSION, type InteriorProject } from "@/types/project";

const blendModes: BlendMode[] = ["normal", "multiply", "color", "overlay"];
const hexPattern = /^#[0-9a-f]{6}$/i;

export function migrateProject(project: InteriorProject) {
  if (project.version !== CURRENT_PROJECT_VERSION) throw new Error("INCOMPATIBLE_VERSION");
  return project;
}

function validMask(value: unknown, width: number, height: number): value is WallMask {
  if (!value || typeof value !== "object") return false;
  const mask = value as WallMask;
  if (typeof mask.id !== "string" || typeof mask.name !== "string" || !["auto", "manual"].includes(mask.type)) return false;
  if (typeof mask.visible !== "boolean" || typeof mask.selected !== "boolean") return false;
  if (typeof mask.opacity !== "number" || mask.opacity < 0 || mask.opacity > 1) return false;
  if (mask.color && !hexPattern.test(mask.color)) return false;
  if (mask.blendMode && !blendModes.includes(mask.blendMode)) return false;
  if (mask.points && (!Array.isArray(mask.points) || mask.points.length > 10_000 || mask.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < -width || point.x > width * 2 || point.y < -height || point.y > height * 2))) return false;
  if (mask.refinement && (!Array.isArray(mask.refinement.addStrokes) || !Array.isArray(mask.refinement.removeStrokes))) return false;
  const strokes = mask.refinement ? [...mask.refinement.addStrokes, ...mask.refinement.removeStrokes] : [];
  if (strokes.length > 10_000 || strokes.some((stroke) => !["add", "remove"].includes(stroke.mode) || stroke.size <= 0 || stroke.size > Math.max(width, height) || stroke.hardness < 0 || stroke.hardness > 1 || stroke.opacity < 0 || stroke.opacity > 1 || !Array.isArray(stroke.points) || stroke.points.length > 100_000 || stroke.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > width || point.y < 0 || point.y > height))) return false;
  return true;
}

export function validateImportedProject(value: unknown): InteriorProject {
  if (!value || typeof value !== "object") throw new Error("INVALID_PROJECT");
  const project = value as InteriorProject;
  if (project.version !== CURRENT_PROJECT_VERSION) throw new Error("INCOMPATIBLE_VERSION");
  if (typeof project.name !== "string" || !project.name.trim() || project.name.length > 80 || (project.description && (typeof project.description !== "string" || project.description.length > 300))) throw new Error("INVALID_PROJECT");
  if (!project.originalImage || typeof project.originalImage !== "object" || typeof project.originalImage.name !== "string" || typeof project.originalImage.type !== "string" || !project.originalImage.type.startsWith("image/") || !Number.isFinite(project.originalImage.width) || !Number.isFinite(project.originalImage.height) || project.originalImage.width <= 0 || project.originalImage.height <= 0 || !project.originalImage.dataUrl?.startsWith("data:image/")) throw new Error("INVALID_PROJECT");
  if (!Array.isArray(project.masks) || project.masks.length > 500 || project.masks.some((mask) => !validMask(mask, project.originalImage.width, project.originalImage.height))) throw new Error("INVALID_PROJECT");
  if (!blendModes.includes(project.globalBlendMode) || !project.editorSettings || !Number.isFinite(project.editorSettings.zoom) || !Number.isFinite(project.editorSettings.brushSize) || !Number.isFinite(project.editorSettings.brushHardness) || !Number.isFinite(project.editorSettings.brushOpacity) || project.editorSettings.zoom <= 0 || project.editorSettings.brushSize <= 0 || project.editorSettings.brushHardness < 0 || project.editorSettings.brushHardness > 1 || project.editorSettings.brushOpacity < 0 || project.editorSettings.brushOpacity > 1) throw new Error("INVALID_PROJECT");
  const validId = typeof project.id === "string" && /^[a-z0-9-]{1,128}$/i.test(project.id);
  return { ...project, id: validId ? project.id : crypto.randomUUID() };
}
