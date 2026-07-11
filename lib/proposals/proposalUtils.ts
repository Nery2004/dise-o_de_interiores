import type { WallMask } from "@/types/editor";
import type { DesignProposal } from "@/types/proposal";

export function cloneProposalMasks(masks: WallMask[]) {
  return masks.map((mask) => ({
    ...mask,
    points: mask.points?.map((point) => ({ ...point })),
    originalPoints: mask.originalPoints?.map((point) => ({ ...point })),
    refinement: mask.refinement ? {
      ...mask.refinement,
      addStrokes: mask.refinement.addStrokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ ...point })) })),
      removeStrokes: mask.refinement.removeStrokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ ...point })) })),
    } : undefined,
  }));
}

export function createProposalSnapshot(masks: WallMask[]) { return cloneProposalMasks(masks); }
export function applyProposalSnapshot(proposal: DesignProposal) { return cloneProposalMasks(proposal.masksSnapshot); }
export function normalizeExportFilename(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "propuesta"; }
