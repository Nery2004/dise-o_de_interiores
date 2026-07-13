import { cloneMask } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { ArchitectureLine, BinaryMask } from "@/lib/wallDetection/pipeline/types";

export function hasReliablePerspectiveStructure(lines: ArchitectureLine[], exclusions: BinaryMask[] = []) {
  const vertical = lines.filter((line) => line.kind === "vertical");
  const denseStructure = vertical.length >= 4 && vertical.filter((line) => line.support >= 0.12).length >= 2;
  const strongPair = vertical.filter((line) => line.support >= 0.18).length >= 2;
  const lowExclusion = exclusions.some((exclusion) => {
    const startY = Math.floor(exclusion.height * 0.82);
    for (let y = startY; y < exclusion.height; y += 1)
      for (let x = 0; x < exclusion.width; x += 1)
        if (exclusion.data[y * exclusion.width + x]) return true;
    return false;
  });
  return denseStructure || (strongPair && lowExclusion);
}

export class PerspectiveCorrector {
  correct(mask: BinaryMask, lines: ArchitectureLine[], tolerance: number, maximumDisplacement: number, exclusions: BinaryMask[] = []): BinaryMask {
    if (!hasReliablePerspectiveStructure(lines, exclusions)) return cloneMask(mask);
    const output = cloneMask(mask);
    const limit = Math.max(1, Math.min(tolerance, maximumDisplacement));
    const strongLines = lines.filter((line) => line.support >= 0.06);
    for (let y = 0; y < mask.height; y += 1) {
      let left = -1; let right = -1;
      for (let x = 0; x < mask.width; x += 1) if (mask.data[y * mask.width + x]) { left = x; break; }
      for (let x = mask.width - 1; x >= 0; x -= 1) if (mask.data[y * mask.width + x]) { right = x; break; }
      if (left < 0 || right < 0) continue;
      for (const boundary of [left, right]) {
        const candidates = strongLines.filter((line) => line.kind !== "horizontal" && Math.abs(line.a) > 0.15)
          .map((line) => ({ x: -(line.b * y + line.c) / line.a, line }))
          .filter(({ x }) => Math.abs(x - boundary) <= limit)
          .sort((a, b) => b.line.support - a.line.support);
        const target = candidates[0]?.x;
        if (target === undefined) continue;
        const rounded = Math.max(0, Math.min(mask.width - 1, Math.round(target)));
        const start = Math.min(boundary, rounded); const end = Math.max(boundary, rounded);
        const expands = boundary === left ? rounded < boundary : rounded > boundary;
        for (let x = start; x <= end; x += 1) output.data[y * mask.width + x] = expands ? 1 : 0;
        if (!expands) output.data[y * mask.width + rounded] = 1;
      }
    }
    for (let x = 0; x < mask.width; x += 1) {
      let top = -1; let bottom = -1;
      for (let y = 0; y < mask.height; y += 1) if (mask.data[y * mask.width + x]) { top = y; break; }
      for (let y = mask.height - 1; y >= 0; y -= 1) if (mask.data[y * mask.width + x]) { bottom = y; break; }
      if (top < 0 || bottom < 0) continue;
      for (const boundary of [top, bottom]) {
        const candidates = strongLines.filter((line) => line.kind === "horizontal" && Math.abs(line.b) > 0.15)
          .map((line) => ({ y: -(line.a * x + line.c) / line.b, line }))
          .filter(({ y }) => Math.abs(y - boundary) <= limit)
          .sort((a, b) => b.line.support - a.line.support);
        const target = candidates[0]?.y;
        if (target === undefined) continue;
        const rounded = Math.max(0, Math.min(mask.height - 1, Math.round(target)));
        const start = Math.min(boundary, rounded); const end = Math.max(boundary, rounded);
        const expands = boundary === top ? rounded < boundary : rounded > boundary;
        for (let y = start; y <= end; y += 1) output.data[y * mask.width + x] = expands ? 1 : 0;
        if (!expands) output.data[rounded * mask.width + x] = 1;
      }
    }
    return output;
  }
}
