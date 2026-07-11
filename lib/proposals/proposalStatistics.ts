import type { DesignProposal } from "@/types/proposal";

export function getProposalColors(proposal: DesignProposal) { return [...new Set(proposal.masksSnapshot.map((mask) => mask.color).filter((color): color is string => Boolean(color)))]; }
export function countColoredWalls(proposal: DesignProposal) { return proposal.masksSnapshot.filter((mask) => mask.visible && mask.color).length; }
export function getDominantColor(proposal: DesignProposal) { const counts = new Map<string, number>(); proposal.masksSnapshot.forEach((mask) => { if (mask.color) counts.set(mask.color, (counts.get(mask.color) ?? 0) + 1); }); return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null; }
export function getMostUsedBlendMode(proposal: DesignProposal) { const counts = new Map<string, number>(); proposal.masksSnapshot.forEach((mask) => { const mode = mask.blendMode ?? "multiply"; counts.set(mode, (counts.get(mode) ?? 0) + 1); }); return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "multiply"; }
