import type { BlendMode, WallMask } from "@/types/editor";
import { CURRENT_PROJECT_VERSION, type InteriorProject } from "@/types/project";
import { withDefaultPaintSettings } from "@/lib/paint/paintSettings";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PerspectiveGuide, PlacementSurface } from "@/types/perspective";
import {
  categoryForPlacedObject,
  defaultPlacementForCategory,
} from "@/lib/perspective/objectAnchoring";
import { withLightingDefaults } from "@/lib/lighting/lightProfile";
import type { RoomLightProfile } from "@/types/lighting";
import type { ObjectGroup } from "@/types/object-group";

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
  if (project.version === 1 || project.version === 2 || project.version === 3) {
    const proposals = project.version === 1 ? [] : (project.proposals ?? []);
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      masks: project.masks.map(withDefaultPaintSettings),
      placedObjects: [],
      objectGroups: [],
      objectFolders: [],
      favoriteObjectIds: [],
      placementSurfaces: [],
      perspectiveGuide: null,
      roomLightProfiles: [],
      activeRoomLightProfileId: undefined,
      proposals: proposals.map((proposal) => ({
        ...proposal,
        masksSnapshot: proposal.masksSnapshot.map(withDefaultPaintSettings),
        placedObjectsSnapshot: [],
        objectGroupsSnapshot: [],
        placementSurfacesSnapshot: [],
        perspectiveGuideSnapshot: null,
        roomLightProfileSnapshot: undefined,
      })),
    } as InteriorProject;
  }
  if (project.version === 4) {
    const legacy = project as InteriorProject & {
      placementSurfaces?: PlacementSurface[];
      perspectiveGuide?: PerspectiveGuide | null;
    };
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      placedObjects: (project.placedObjects ?? []).map(withPerspectiveDefaults),
      objectGroups: [],
      objectFolders: [],
      favoriteObjectIds: [],
      placementSurfaces: legacy.placementSurfaces ?? [],
      perspectiveGuide: legacy.perspectiveGuide ?? null,
      roomLightProfiles: [],
      activeRoomLightProfileId: undefined,
      proposals: (project.proposals ?? []).map((proposal) => ({
        ...proposal,
        placedObjectsSnapshot: (proposal.placedObjectsSnapshot ?? []).map(
          withPerspectiveDefaults,
        ),
        objectGroupsSnapshot: [],
        placementSurfacesSnapshot: proposal.placementSurfacesSnapshot ?? [],
        perspectiveGuideSnapshot: proposal.perspectiveGuideSnapshot ?? null,
        roomLightProfileSnapshot: undefined,
      })),
    } as InteriorProject;
  }
  if (project.version === 5) {
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      placedObjects: (project.placedObjects ?? []).map((object) =>
        withLightingDefaults(object, categoryForPlacedObject(object)),
      ),
      objectGroups: [],
      objectFolders: [],
      favoriteObjectIds: [],
      roomLightProfiles: [],
      activeRoomLightProfileId: undefined,
      proposals: (project.proposals ?? []).map((proposal) => ({
        ...proposal,
        placedObjectsSnapshot: (proposal.placedObjectsSnapshot ?? []).map((object) =>
          withLightingDefaults(object, categoryForPlacedObject(object)),
        ),
        objectGroupsSnapshot: [],
        roomLightProfileSnapshot: undefined,
      })),
    } as InteriorProject;
  }
  if (project.version === 6) {
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      placedObjects: project.placedObjects.map((object) => withLightingDefaults(object, categoryForPlacedObject(object))),
      objectGroups: [],
      objectFolders: [],
      favoriteObjectIds: [],
      proposals: project.proposals.map((proposal) => ({ ...proposal, placedObjectsSnapshot: proposal.placedObjectsSnapshot.map((object) => withLightingDefaults(object, categoryForPlacedObject(object))), objectGroupsSnapshot: [] })),
    } as InteriorProject;
  }
  if (project.version !== CURRENT_PROJECT_VERSION)
    throw new Error("INCOMPATIBLE_VERSION");
  if (
    !Array.isArray(project.placedObjects) ||
    project.placedObjects.some(
      (object) =>
        !validPlacedObject(
          object,
          project.originalImage.width,
          project.originalImage.height,
        ),
    )
  )
    throw new Error("CORRUPT_PROJECT");
  if (
    !Array.isArray(project.roomLightProfiles) ||
    project.roomLightProfiles.some((profile) => !validRoomLightProfile(profile)) ||
    (project.activeRoomLightProfileId !== undefined &&
      !project.roomLightProfiles.some((profile) => profile.id === project.activeRoomLightProfileId)) ||
    project.placedObjects.some((object) => object.lightProfileId !== undefined && !project.roomLightProfiles.some((profile) => profile.id === object.lightProfileId))
  )
    throw new Error("CORRUPT_PROJECT");
  if (!validObjectGroups(project.objectGroups, project.placedObjects)) throw new Error("CORRUPT_PROJECT");
  if (!validObjectFolders(project.objectFolders)) throw new Error("CORRUPT_PROJECT");
  if (!Array.isArray(project.favoriteObjectIds) || project.favoriteObjectIds.some((id) => typeof id !== "string")) throw new Error("CORRUPT_PROJECT");
  if (
    !Array.isArray(project.proposals) ||
    project.proposals.some(
      (proposal) =>
        !validProposal(
          proposal,
          project.originalImage.width,
          project.originalImage.height,
        ),
    )
  )
    throw new Error("CORRUPT_PROJECT");
  if (
    !Array.isArray(project.placementSurfaces) ||
    project.placementSurfaces.some(
      (surface) =>
        !validPlacementSurface(
          surface,
          project.originalImage.width,
          project.originalImage.height,
        ),
    ) ||
    !validPerspectiveGuide(
      project.perspectiveGuide,
      project.originalImage.width,
      project.originalImage.height,
    )
  )
    throw new Error("CORRUPT_PROJECT");
  return project;
}

function withPerspectiveDefaults(object: PlacedDecorObject): PlacedDecorObject {
  const defaults = defaultPlacementForCategory(categoryForPlacedObject(object));
  return withLightingDefaults({
    ...object,
    surfaceType: defaults.surfaceType,
    anchor: "center",
    depth: 0.5,
    perspectiveMode: "none",
    perspectivePoints: undefined,
    surfaceId: undefined,
    autoScaleByDepth: false,
    baseContactOffset: 0,
    zOrderMode: "manual",
  }, categoryForPlacedObject(object));
}

function validRoomLightProfile(value: unknown): value is RoomLightProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as RoomLightProfile;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" && profile.name.length > 0 && profile.name.length <= 80 &&
    ["auto", "manual"].includes(profile.mode) &&
    Number.isFinite(profile.direction?.x) && Number.isFinite(profile.direction?.y) &&
    Math.abs(Math.hypot(profile.direction.x, profile.direction.y) - 1) < 0.02 &&
    Number.isFinite(profile.elevation) && profile.elevation >= 0 && profile.elevation <= 90 &&
    Number.isFinite(profile.intensity) && profile.intensity >= 0 && profile.intensity <= 100 &&
    Number.isFinite(profile.temperature) && Math.abs(profile.temperature) <= 100 &&
    Number.isFinite(profile.ambientBrightness) && Math.abs(profile.ambientBrightness) <= 100 &&
    Number.isFinite(profile.ambientContrast) && Math.abs(profile.ambientContrast) <= 100 &&
    Number.isFinite(profile.shadowStrength) && profile.shadowStrength >= 0 && profile.shadowStrength <= 100 &&
    Number.isFinite(profile.shadowSoftness) && profile.shadowSoftness >= 0 && profile.shadowSoftness <= 100 &&
    ["window", "ceiling-light", "lamp", "mixed", "unknown"].includes(profile.sourceType) &&
    typeof profile.createdAt === "string" && typeof profile.updatedAt === "string"
  );
}

function validObjectGroups(value: unknown, objects: PlacedDecorObject[]): value is ObjectGroup[] {
  if (!Array.isArray(value) || value.length > 200) return false;
  const objectIds = new Set(objects.map((object) => object.id));
  const groupIds = new Set<string>();
  for (const group of value as ObjectGroup[]) {
    if (!group || typeof group !== "object" || typeof group.id !== "string" || groupIds.has(group.id) || typeof group.name !== "string" || !group.name || group.name.length > 80 || !Array.isArray(group.objectIds) || group.objectIds.length < 2 || group.objectIds.some((id) => !objectIds.has(id)) || !Array.isArray(group.tags) || group.tags.some((tag) => typeof tag !== "string") || typeof group.visible !== "boolean" || typeof group.locked !== "boolean") return false;
    groupIds.add(group.id);
  }
  return objects.every((object) => object.groupId === undefined || groupIds.has(object.groupId));
}

function validObjectFolders(value: unknown) {
  return Array.isArray(value) && value.length <= 100 && value.every((folder) => folder && typeof folder === "object" && typeof folder.id === "string" && typeof folder.name === "string" && folder.name.length > 0 && folder.name.length <= 60 && Array.isArray(folder.objectIds) && folder.objectIds.every((id: unknown) => typeof id === "string"));
}

function validPlacedObject(
  value: unknown,
  width: number,
  height: number,
): value is PlacedDecorObject {
  if (!value || typeof value !== "object") return false;
  const object = value as PlacedDecorObject;
  const finite = [
    object.originalWidth,
    object.originalHeight,
    object.x,
    object.y,
    object.width,
    object.height,
    object.scaleX,
    object.scaleY,
    object.rotation,
    object.opacity,
    object.zIndex,
    object.brightness,
    object.contrast,
    object.saturation,
    object.temperature,
    object.tint,
    object.exposure,
    object.highlights,
    object.shadows,
    object.sharpness,
    object.depthBlur,
    object.grain,
  ];
  const validPoints =
    !object.perspectivePoints ||
    Object.values(object.perspectivePoints).every(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        point.x >= -width &&
        point.x <= width * 2 &&
        point.y >= -height &&
        point.y <= height * 2,
    );
  return (
    typeof object.id === "string" &&
    typeof object.decorObjectId === "string" &&
    typeof object.name === "string" &&
    object.name.length > 0 &&
    object.name.length <= 80 &&
    typeof object.assetUrl === "string" &&
    /^\/decor\/[a-z0-9/_-]+\.(png|webp)$/i.test(object.assetUrl) &&
    ["png", "webp"].includes(object.assetType) &&
    finite.every(Number.isFinite) &&
    object.originalWidth > 0 &&
    object.originalHeight > 0 &&
    object.width >= 1 &&
    object.height >= 1 &&
    object.width <= width * 2 &&
    object.height <= height * 2 &&
    object.x >= -width &&
    object.x <= width * 2 &&
    object.y >= -height &&
    object.y <= height * 2 &&
    object.scaleX > 0 &&
    object.scaleY > 0 &&
    object.opacity >= 0 &&
    object.opacity <= 1 &&
    Number.isInteger(object.zIndex) &&
    object.zIndex >= 0 &&
    [
      object.visible,
      object.locked,
      object.selected,
      object.flipX,
      object.flipY,
      object.lockAspectRatio,
      object.autoScaleByDepth,
    ].every((item) => typeof item === "boolean") &&
    ["floor", "wall", "table", "ceiling", "free"].includes(
      object.surfaceType,
    ) &&
    ["center", "bottom-center", "top-center"].includes(object.anchor) &&
    Number.isFinite(object.depth) &&
    object.depth >= 0 &&
    object.depth <= 1 &&
    ["none", "surface", "free-transform"].includes(object.perspectiveMode) &&
    Number.isFinite(object.baseContactOffset) &&
    Math.abs(object.baseContactOffset) <= height &&
    ["manual", "depth"].includes(object.zOrderMode) &&
    ["auto", "manual", "none"].includes(object.lightingMode) &&
    Array.isArray(object.tags) && object.tags.length <= 30 && object.tags.every((tag) => typeof tag === "string" && tag.length <= 40) &&
    ["small", "medium", "large"].includes(object.relativeScale) &&
    (object.groupId === undefined || typeof object.groupId === "string") &&
    [object.adaptDepthBlur, object.adaptTexture].every((item) => typeof item === "boolean") &&
    (object.lightingLocked === undefined || typeof object.lightingLocked === "boolean") &&
    [object.brightness, object.contrast, object.saturation, object.temperature, object.tint, object.exposure, object.highlights, object.shadows, object.sharpness].every((item) => Math.abs(item) <= 100) &&
    object.depthBlur >= 0 && object.depthBlur <= 8 &&
    object.grain >= 0 && object.grain <= 20 &&
    (!object.shadowSettings || validShadowSettings(object.shadowSettings)) &&
    validPoints &&
    typeof object.createdAt === "string" &&
    typeof object.updatedAt === "string"
  );
}

function validShadowSettings(settings: NonNullable<PlacedDecorObject["shadowSettings"]>) {
  return (
    typeof settings.enabled === "boolean" &&
    ["contact", "projected", "both"].includes(settings.type) &&
    /^#[0-9a-f]{6}$/i.test(settings.color) &&
    typeof settings.autoDirection === "boolean" &&
    [settings.opacity, settings.contactOpacity].every((value) => Number.isFinite(value) && value >= 0 && value <= 1) &&
    [settings.blur, settings.contactBlur].every((value) => Number.isFinite(value) && value >= 0 && value <= 50) &&
    Number.isFinite(settings.softness) && settings.softness >= 0 && settings.softness <= 100 &&
    [settings.offsetX, settings.offsetY, settings.rotation].every(Number.isFinite) &&
    [settings.scaleX, settings.scaleY].every((value) => Number.isFinite(value) && value > 0 && value <= 3) &&
    [settings.contactWidth, settings.contactHeight].every((value) => Number.isFinite(value) && value > 0 && value <= 2)
  );
}

function validPlacementSurface(
  value: unknown,
  width: number,
  height: number,
): value is PlacementSurface {
  if (!value || typeof value !== "object") return false;
  const surface = value as PlacementSurface;
  return (
    typeof surface.id === "string" &&
    typeof surface.name === "string" &&
    surface.name.length > 0 &&
    surface.name.length <= 80 &&
    ["floor", "wall", "table", "ceiling", "free"].includes(surface.type) &&
    Array.isArray(surface.points) &&
    surface.points.length >= 3 &&
    surface.points.length <= 100 &&
    surface.points.every(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        point.x >= -width &&
        point.x <= width * 2 &&
        point.y >= -height &&
        point.y <= height * 2,
    ) &&
    [
      surface.visible,
      surface.locked,
      surface.selected,
      surface.detected,
      surface.snapEnabled,
    ].every((item) => typeof item === "boolean") &&
    typeof surface.createdAt === "string" &&
    typeof surface.updatedAt === "string"
  );
}

function validPerspectiveGuide(
  value: PerspectiveGuide | null | undefined,
  width: number,
  height: number,
) {
  if (value == null) return true;
  const validPoint = (point?: { x: number; y: number }) =>
    !point ||
    (Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= -width &&
      point.x <= width * 2 &&
      point.y >= -height &&
      point.y <= height * 2);
  return (
    Number.isFinite(value.horizonY) &&
    value.horizonY >= -height &&
    value.horizonY <= height * 2 &&
    typeof value.visible === "boolean" &&
    validPoint(value.vanishingPoint1) &&
    validPoint(value.vanishingPoint2)
  );
}

function validMask(
  value: unknown,
  width: number,
  height: number,
): value is WallMask {
  if (!value || typeof value !== "object") return false;
  const mask = value as WallMask;
  if (
    typeof mask.id !== "string" ||
    typeof mask.name !== "string" ||
    !["auto", "manual"].includes(mask.type)
  )
    return false;
  if (typeof mask.visible !== "boolean" || typeof mask.selected !== "boolean")
    return false;
  if (typeof mask.opacity !== "number" || mask.opacity < 0 || mask.opacity > 1)
    return false;
  if (mask.color && !hexPattern.test(mask.color)) return false;
  if (mask.blendMode && !blendModes.includes(mask.blendMode)) return false;
  if (mask.paintMode && !["direct", "white-base"].includes(mask.paintMode))
    return false;
  if (
    mask.renderQuality &&
    !["draft", "high", "ultra"].includes(mask.renderQuality)
  )
    return false;
  if (
    mask.primerCoverage !== undefined &&
    (!Number.isFinite(mask.primerCoverage) ||
      mask.primerCoverage < 0 ||
      mask.primerCoverage > 100)
  )
    return false;
  if (
    mask.paintIntensity !== undefined &&
    (!Number.isFinite(mask.paintIntensity) ||
      mask.paintIntensity < 0 ||
      mask.paintIntensity > 200)
  )
    return false;
  if (
    mask.edgeFeather !== undefined &&
    (!Number.isFinite(mask.edgeFeather) ||
      mask.edgeFeather < 0 ||
      mask.edgeFeather > 40)
  )
    return false;
  if (mask.whiteBaseSettings) {
    const settings = mask.whiteBaseSettings;
    if (!["auto", "manual"].includes(settings.mode)) return false;
    if (
      !Number.isInteger(settings.analysisVersion) ||
      settings.analysisVersion < 1
    )
      return false;
    if (
      settings.analysisKey !== undefined &&
      typeof settings.analysisKey !== "string"
    )
      return false;
    if (
      settings.analyzedAt !== undefined &&
      typeof settings.analyzedAt !== "string"
    )
      return false;
    if (settings.averageColor && !hexPattern.test(settings.averageColor))
      return false;
    if (settings.medianColor && !hexPattern.test(settings.medianColor))
      return false;
    if (
      settings.profile &&
      ![
        "warm-light",
        "warm-dark",
        "cool-light",
        "cool-dark",
        "neutral-light",
        "neutral-dark",
        "saturated",
        "unknown",
      ].includes(settings.profile)
    )
      return false;
    const ranges: Array<[number | undefined, number, number]> = [
      [settings.neutralizationStrength, 0, 100],
      [settings.saturationReduction, 0, 100],
      [settings.warmthCorrection, -100, 100],
      [settings.baseBrightness, 0, 100],
      [settings.baseContrast, -50, 50],
      [settings.shadowPreservation, 0, 100],
      [settings.texturePreservation, 0, 100],
    ];
    if (
      ranges.some(
        ([value, minimum, maximum]) =>
          value === undefined ||
          !Number.isFinite(value) ||
          value < minimum ||
          value > maximum,
      )
    )
      return false;
    const derived = [
      settings.averageLuminance,
      settings.averageSaturation,
      settings.darkPixelRatio,
      settings.lightPixelRatio,
    ];
    if (
      derived.some(
        (value) =>
          value !== undefined &&
          (!Number.isFinite(value) || value < 0 || value > 1),
      )
    )
      return false;
    if (
      settings.dominantHue !== undefined &&
      (!Number.isFinite(settings.dominantHue) ||
        settings.dominantHue < 0 ||
        settings.dominantHue > 360)
    )
      return false;
  }
  if (
    mask.points &&
    (!Array.isArray(mask.points) ||
      mask.points.length > 10_000 ||
      mask.points.some(
        (point) =>
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          point.x < -width ||
          point.x > width * 2 ||
          point.y < -height ||
          point.y > height * 2,
      ))
  )
    return false;
  if (
    mask.refinement &&
    (!Array.isArray(mask.refinement.addStrokes) ||
      !Array.isArray(mask.refinement.removeStrokes))
  )
    return false;
  const strokes = mask.refinement
    ? [...mask.refinement.addStrokes, ...mask.refinement.removeStrokes]
    : [];
  if (
    strokes.length > 10_000 ||
    strokes.some(
      (stroke) =>
        !["add", "remove"].includes(stroke.mode) ||
        stroke.size <= 0 ||
        stroke.size > Math.max(width, height) ||
        stroke.hardness < 0 ||
        stroke.hardness > 1 ||
        stroke.opacity < 0 ||
        stroke.opacity > 1 ||
        !Array.isArray(stroke.points) ||
        stroke.points.length > 100_000 ||
        stroke.points.some(
          (point) =>
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y) ||
            point.x < 0 ||
            point.x > width ||
            point.y < 0 ||
            point.y > height,
        ),
    )
  )
    return false;
  return true;
}

function validProposal(value: unknown, width: number, height: number) {
  if (!value || typeof value !== "object") return false;
  const proposal = value as InteriorProject["proposals"][number];
  return (
    typeof proposal.id === "string" &&
    typeof proposal.name === "string" &&
    proposal.name.length > 0 &&
    proposal.name.length <= 80 &&
    (!proposal.thumbnail ||
      /^data:image\/jpeg;base64,/i.test(proposal.thumbnail)) &&
    (!proposal.tags ||
      (Array.isArray(proposal.tags) &&
        proposal.tags.every((tag) => typeof tag === "string"))) &&
    Array.isArray(proposal.masksSnapshot) &&
    proposal.masksSnapshot.length <= 500 &&
    proposal.masksSnapshot.every((mask) => validMask(mask, width, height)) &&
    Array.isArray(proposal.placedObjectsSnapshot) &&
    proposal.placedObjectsSnapshot.length <= 500 &&
    proposal.placedObjectsSnapshot.every((object) =>
      validPlacedObject(object, width, height),
    ) &&
    validObjectGroups(proposal.objectGroupsSnapshot, proposal.placedObjectsSnapshot) &&
    Array.isArray(proposal.placementSurfacesSnapshot) &&
    proposal.placementSurfacesSnapshot.length <= 100 &&
    proposal.placementSurfacesSnapshot.every((surface) =>
      validPlacementSurface(surface, width, height),
    ) &&
    validPerspectiveGuide(proposal.perspectiveGuideSnapshot, width, height)
    && (!proposal.roomLightProfileSnapshot || validRoomLightProfile(proposal.roomLightProfileSnapshot))
  );
}

export function validateImportedProject(value: unknown): InteriorProject {
  if (!value || typeof value !== "object") throw new Error("INVALID_PROJECT");
  const project = value as InteriorProject;
  if (![1, 2, 3, 4, 5, 6, CURRENT_PROJECT_VERSION].includes(project.version))
    throw new Error("INCOMPATIBLE_VERSION");
  if (
    typeof project.name !== "string" ||
    !project.name.trim() ||
    project.name.length > 80 ||
    (project.description &&
      (typeof project.description !== "string" ||
        project.description.length > 300))
  )
    throw new Error("INVALID_PROJECT");
  if (
    !project.originalImage ||
    typeof project.originalImage !== "object" ||
    typeof project.originalImage.name !== "string" ||
    typeof project.originalImage.type !== "string" ||
    !project.originalImage.type.startsWith("image/") ||
    !Number.isFinite(project.originalImage.width) ||
    !Number.isFinite(project.originalImage.height) ||
    project.originalImage.width <= 0 ||
    project.originalImage.height <= 0 ||
    !project.originalImage.dataUrl?.startsWith("data:image/")
  )
    throw new Error("INVALID_PROJECT");
  if (
    !Array.isArray(project.masks) ||
    project.masks.length > 500 ||
    project.masks.some(
      (mask) =>
        !validMask(
          mask,
          project.originalImage.width,
          project.originalImage.height,
        ),
    )
  )
    throw new Error("INVALID_PROJECT");
  if (
    project.version >= 4 &&
    (!Array.isArray(project.placedObjects) ||
      project.placedObjects.length > 500 ||
      project.placedObjects.some((object) =>
        project.version === 4
          ? !validPlacedObject(
              withPerspectiveDefaults(object),
              project.originalImage.width,
              project.originalImage.height,
            )
          : project.version === 5 || project.version === 6
            ? !validPlacedObject(withLightingDefaults(object, categoryForPlacedObject(object)), project.originalImage.width, project.originalImage.height)
            : !validPlacedObject(
              object,
              project.originalImage.width,
              project.originalImage.height,
            ),
      ))
  )
    throw new Error("INVALID_PROJECT");
  if (
    project.version >= 5 &&
    (!Array.isArray(project.placementSurfaces) ||
      project.placementSurfaces.length > 100 ||
      project.placementSurfaces.some(
        (surface) =>
          !validPlacementSurface(
            surface,
            project.originalImage.width,
            project.originalImage.height,
          ),
      ) ||
      !validPerspectiveGuide(
        project.perspectiveGuide,
        project.originalImage.width,
        project.originalImage.height,
      ))
  )
    throw new Error("INVALID_PROJECT");
  if (
    project.version >= 6 &&
    (!Array.isArray(project.roomLightProfiles) ||
      project.roomLightProfiles.length > 50 ||
      project.roomLightProfiles.some((profile) => !validRoomLightProfile(profile)) ||
      (project.activeRoomLightProfileId !== undefined &&
        !project.roomLightProfiles.some((profile) => profile.id === project.activeRoomLightProfileId)))
  )
    throw new Error("INVALID_PROJECT");
  if (project.version >= 7 && !validObjectGroups(project.objectGroups, project.placedObjects)) throw new Error("INVALID_PROJECT");
  if (project.version >= 7 && !validObjectFolders(project.objectFolders)) throw new Error("INVALID_PROJECT");
  if (project.version >= 7 && (!Array.isArray(project.favoriteObjectIds) || project.favoriteObjectIds.length > 1000 || project.favoriteObjectIds.some((id) => typeof id !== "string"))) throw new Error("INVALID_PROJECT");
  if (
    project.version >= 2 &&
    (!Array.isArray(project.proposals) ||
      project.proposals.length > 200 ||
      project.proposals.some((proposal) =>
        project.version === 4
          ? !validProposal(
              {
                ...proposal,
                placedObjectsSnapshot: (
                  proposal.placedObjectsSnapshot ?? []
                ).map(withPerspectiveDefaults),
                placementSurfacesSnapshot: [],
                perspectiveGuideSnapshot: null,
                objectGroupsSnapshot: [],
              },
              project.originalImage.width,
              project.originalImage.height,
            )
          : project.version < 4
            ? false
            : project.version === 5
              ? !validProposal({
                  ...proposal,
                  placedObjectsSnapshot: (proposal.placedObjectsSnapshot ?? []).map((object) => withLightingDefaults(object, categoryForPlacedObject(object))),
                  objectGroupsSnapshot: [],
                }, project.originalImage.width, project.originalImage.height)
            : project.version === 6
              ? !validProposal({ ...proposal, placedObjectsSnapshot: proposal.placedObjectsSnapshot.map((object) => withLightingDefaults(object, categoryForPlacedObject(object))), objectGroupsSnapshot: [] }, project.originalImage.width, project.originalImage.height)
            : !validProposal(
                proposal,
                project.originalImage.width,
                project.originalImage.height,
              ),
      ))
  )
    throw new Error("INVALID_PROJECT");
  if (
    !blendModes.includes(project.globalBlendMode) ||
    !project.editorSettings ||
    !Number.isFinite(project.editorSettings.zoom) ||
    !Number.isFinite(project.editorSettings.brushSize) ||
    !Number.isFinite(project.editorSettings.brushHardness) ||
    !Number.isFinite(project.editorSettings.brushOpacity) ||
    project.editorSettings.zoom <= 0 ||
    project.editorSettings.brushSize <= 0 ||
    project.editorSettings.brushHardness < 0 ||
    project.editorSettings.brushHardness > 1 ||
    project.editorSettings.brushOpacity < 0 ||
    project.editorSettings.brushOpacity > 1
  )
    throw new Error("INVALID_PROJECT");
  const validId =
    typeof project.id === "string" && /^[a-z0-9-]{1,128}$/i.test(project.id);
  return migrateProject({
    ...project,
    id: validId ? project.id : crypto.randomUUID(),
  });
}
