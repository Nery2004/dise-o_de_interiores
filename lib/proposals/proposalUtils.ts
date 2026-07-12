import type { WallMask } from "@/types/editor";
import type { DesignProposal } from "@/types/proposal";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PerspectiveGuide, PlacementSurface } from "@/types/perspective";

export function cloneProposalMasks(masks: WallMask[]) {
  return masks.map((mask) => ({
    ...mask,
    points: mask.points?.map((point) => ({ ...point })),
    originalPoints: mask.originalPoints?.map((point) => ({ ...point })),
    refinement: mask.refinement
      ? {
          ...mask.refinement,
          addStrokes: mask.refinement.addStrokes.map((stroke) => ({
            ...stroke,
            points: stroke.points.map((point) => ({ ...point })),
          })),
          removeStrokes: mask.refinement.removeStrokes.map((stroke) => ({
            ...stroke,
            points: stroke.points.map((point) => ({ ...point })),
          })),
        }
      : undefined,
    whiteBaseSettings: mask.whiteBaseSettings
      ? { ...mask.whiteBaseSettings }
      : undefined,
  }));
}

export function createProposalSnapshot(masks: WallMask[]) {
  return cloneProposalMasks(masks);
}
export function applyProposalSnapshot(proposal: DesignProposal) {
  return cloneProposalMasks(proposal.masksSnapshot);
}
export function clonePlacedDecorObjects(objects: PlacedDecorObject[]) {
  return objects.map((object) => ({
    ...object,
    selected: false,
    perspectivePoints: object.perspectivePoints
      ? {
          topLeft: { ...object.perspectivePoints.topLeft },
          topRight: { ...object.perspectivePoints.topRight },
          bottomRight: { ...object.perspectivePoints.bottomRight },
          bottomLeft: { ...object.perspectivePoints.bottomLeft },
        }
      : undefined,
    shadowSettings: object.shadowSettings ? { ...object.shadowSettings } : undefined,
  }));
}
export function clonePlacementSurfaces(surfaces: PlacementSurface[]) {
  return surfaces.map((surface) => ({
    ...surface,
    selected: false,
    points: surface.points.map((point) => ({ ...point })),
  }));
}
export function clonePerspectiveGuide(guide: PerspectiveGuide | null) {
  return guide
    ? {
        ...guide,
        vanishingPoint1: guide.vanishingPoint1
          ? { ...guide.vanishingPoint1 }
          : undefined,
        vanishingPoint2: guide.vanishingPoint2
          ? { ...guide.vanishingPoint2 }
          : undefined,
      }
    : null;
}
export function normalizeExportFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "propuesta"
  );
}
