import type { BlendMode, WallMask } from "@/types/editor";
import { CURRENT_PROJECT_VERSION, type InteriorProject } from "@/types/project";
import { withDefaultPaintSettings } from "@/lib/paint/paintSettings";

const blendModes: BlendMode[] = [
  "paint-simulation",
  "normal",
  "multiply",
  "color",
  "overlay",
  "soft-light",
  "hard-light",
];
const hexPattern = /^#[0-9a-f]{6}$/i;

export function migrateProject(project: InteriorProject) {
  if (project.version === 1 || project.version === 2) {
    const proposals = project.version === 1 ? [] : project.proposals ?? [];
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      masks: project.masks.map(withDefaultPaintSettings),
      proposals: proposals.map((proposal) => ({
        ...proposal,
        masksSnapshot: proposal.masksSnapshot.map(withDefaultPaintSettings),
      })),
    } as InteriorProject;
  }
  if (project.version !== CURRENT_PROJECT_VERSION) throw new Error("INCOMPATIBLE_VERSION");
  if (!Array.isArray(project.proposals) || project.proposals.some((proposal) => !validProposal(proposal, project.originalImage.width, project.originalImage.height))) throw new Error("CORRUPT_PROJECT");
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
  if (mask.paintMode && !["direct", "white-base"].includes(mask.paintMode)) return false;
  if (mask.renderQuality && !["draft", "high", "ultra"].includes(mask.renderQuality)) return false;
  if (mask.primerCoverage !== undefined && (!Number.isFinite(mask.primerCoverage) || mask.primerCoverage < 0 || mask.primerCoverage > 100)) return false;
  if (mask.paintIntensity !== undefined && (!Number.isFinite(mask.paintIntensity) || mask.paintIntensity < 0 || mask.paintIntensity > 200)) return false;
  if (mask.edgeFeather !== undefined && (!Number.isFinite(mask.edgeFeather) || mask.edgeFeather < 0 || mask.edgeFeather > 40)) return false;
  if (mask.whiteBaseSettings) {
    const settings = mask.whiteBaseSettings;
    if (!["auto", "manual"].includes(settings.mode)) return false;
    if (!Number.isInteger(settings.analysisVersion) || settings.analysisVersion < 1) return false;
    if (settings.analysisKey !== undefined && typeof settings.analysisKey !== "string") return false;
    if (settings.analyzedAt !== undefined && typeof settings.analyzedAt !== "string") return false;
    if (settings.averageColor && !hexPattern.test(settings.averageColor)) return false;
    if (settings.medianColor && !hexPattern.test(settings.medianColor)) return false;
    if (settings.profile && !["warm-light", "warm-dark", "cool-light", "cool-dark", "neutral-light", "neutral-dark", "saturated", "unknown"].includes(settings.profile)) return false;
    const ranges: Array<[number | undefined, number, number]> = [
      [settings.neutralizationStrength, 0, 100],
      [settings.saturationReduction, 0, 100],
      [settings.warmthCorrection, -100, 100],
      [settings.baseBrightness, 0, 100],
      [settings.baseContrast, -50, 50],
      [settings.shadowPreservation, 0, 100],
      [settings.texturePreservation, 0, 100],
    ];
    if (ranges.some(([value, minimum, maximum]) => value === undefined || !Number.isFinite(value) || value < minimum || value > maximum)) return false;
    const derived = [settings.averageLuminance, settings.averageSaturation, settings.darkPixelRatio, settings.lightPixelRatio];
    if (derived.some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1))) return false;
    if (settings.dominantHue !== undefined && (!Number.isFinite(settings.dominantHue) || settings.dominantHue < 0 || settings.dominantHue > 360)) return false;
  }
  if (mask.points && (!Array.isArray(mask.points) || mask.points.length > 10_000 || mask.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < -width || point.x > width * 2 || point.y < -height || point.y > height * 2))) return false;
  if (mask.refinement && (!Array.isArray(mask.refinement.addStrokes) || !Array.isArray(mask.refinement.removeStrokes))) return false;
  const strokes = mask.refinement ? [...mask.refinement.addStrokes, ...mask.refinement.removeStrokes] : [];
  if (strokes.length > 10_000 || strokes.some((stroke) => !["add", "remove"].includes(stroke.mode) || stroke.size <= 0 || stroke.size > Math.max(width, height) || stroke.hardness < 0 || stroke.hardness > 1 || stroke.opacity < 0 || stroke.opacity > 1 || !Array.isArray(stroke.points) || stroke.points.length > 100_000 || stroke.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > width || point.y < 0 || point.y > height))) return false;
  return true;
}

function validProposal(value: unknown, width: number, height: number) {
  if (!value || typeof value !== "object") return false;
  const proposal = value as InteriorProject["proposals"][number];
  return typeof proposal.id === "string" && typeof proposal.name === "string" && proposal.name.length > 0 && proposal.name.length <= 80 && (!proposal.thumbnail || /^data:image\/jpeg;base64,/i.test(proposal.thumbnail)) && (!proposal.tags || (Array.isArray(proposal.tags) && proposal.tags.every((tag) => typeof tag === "string"))) && Array.isArray(proposal.masksSnapshot) && proposal.masksSnapshot.length <= 500 && proposal.masksSnapshot.every((mask) => validMask(mask, width, height));
}

export function validateImportedProject(value: unknown): InteriorProject {
  if (!value || typeof value !== "object") throw new Error("INVALID_PROJECT");
  const project = value as InteriorProject;
  if (![1, 2, CURRENT_PROJECT_VERSION].includes(project.version)) throw new Error("INCOMPATIBLE_VERSION");
  if (typeof project.name !== "string" || !project.name.trim() || project.name.length > 80 || (project.description && (typeof project.description !== "string" || project.description.length > 300))) throw new Error("INVALID_PROJECT");
  if (!project.originalImage || typeof project.originalImage !== "object" || typeof project.originalImage.name !== "string" || typeof project.originalImage.type !== "string" || !project.originalImage.type.startsWith("image/") || !Number.isFinite(project.originalImage.width) || !Number.isFinite(project.originalImage.height) || project.originalImage.width <= 0 || project.originalImage.height <= 0 || !project.originalImage.dataUrl?.startsWith("data:image/")) throw new Error("INVALID_PROJECT");
  if (!Array.isArray(project.masks) || project.masks.length > 500 || project.masks.some((mask) => !validMask(mask, project.originalImage.width, project.originalImage.height))) throw new Error("INVALID_PROJECT");
  if (project.version >= 2 && (!Array.isArray(project.proposals) || project.proposals.length > 200 || project.proposals.some((proposal) => !validProposal(proposal, project.originalImage.width, project.originalImage.height)))) throw new Error("INVALID_PROJECT");
  if (!blendModes.includes(project.globalBlendMode) || !project.editorSettings || !Number.isFinite(project.editorSettings.zoom) || !Number.isFinite(project.editorSettings.brushSize) || !Number.isFinite(project.editorSettings.brushHardness) || !Number.isFinite(project.editorSettings.brushOpacity) || project.editorSettings.zoom <= 0 || project.editorSettings.brushSize <= 0 || project.editorSettings.brushHardness < 0 || project.editorSettings.brushHardness > 1 || project.editorSettings.brushOpacity < 0 || project.editorSettings.brushOpacity > 1) throw new Error("INVALID_PROJECT");
  const validId = typeof project.id === "string" && /^[a-z0-9-]{1,128}$/i.test(project.id);
  return migrateProject({ ...project, id: validId ? project.id : crypto.randomUUID() });
}
