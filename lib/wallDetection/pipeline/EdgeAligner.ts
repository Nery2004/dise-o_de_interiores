import { cloneMask } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { BinaryMask, EdgeMap } from "@/lib/wallDetection/pipeline/types";

function nearestEdge(edgeMap: EdgeMap, x: number, y: number, dx: number, dy: number, limit: number) {
  let best: { x: number; y: number; strength: number; distance: number } | null = null;
  for (let offset = -limit; offset <= limit; offset += 1) {
    const nx = x + dx * offset;
    const ny = y + dy * offset;
    if (nx < 0 || ny < 0 || nx >= edgeMap.width || ny >= edgeMap.height) continue;
    const strength = edgeMap.magnitude[ny * edgeMap.width + nx];
    if (strength < edgeMap.threshold) continue;
    const candidate = { x: nx, y: ny, strength, distance: Math.abs(offset) };
    if (!best || candidate.strength - candidate.distance * 5 > best.strength - best.distance * 5) best = candidate;
  }
  return best;
}

function paintSpan(data: Uint8Array, width: number, fixed: number, from: number, to: number, horizontal: boolean, value: number) {
  const start = Math.min(from, to); const end = Math.max(from, to);
  for (let moving = start; moving <= end; moving += 1) {
    const index = horizontal ? fixed * width + moving : moving * width + fixed;
    data[index] = value;
  }
}

export class EdgeAligner {
  align(mask: BinaryMask, edgeMap: EdgeMap | null, tolerance: number, maximumDisplacement: number): BinaryMask {
    if (!edgeMap || edgeMap.width !== mask.width || edgeMap.height !== mask.height) return cloneMask(mask);
    const output = cloneMask(mask);
    const limit = Math.max(1, Math.min(Math.floor(tolerance), Math.floor(maximumDisplacement)));
    for (let y = 0; y < mask.height; y += 2) {
      let left = -1; let right = -1;
      for (let x = 0; x < mask.width; x += 1) if (mask.data[y * mask.width + x]) { left = x; break; }
      for (let x = mask.width - 1; x >= 0; x -= 1) if (mask.data[y * mask.width + x]) { right = x; break; }
      if (left < 0 || right < 0) continue;
      for (const boundary of [left, right]) {
        const edge = nearestEdge(edgeMap, boundary, y, 1, 0, limit);
        if (!edge || edge.x === boundary) continue;
        const expands = boundary === left ? edge.x < boundary : edge.x > boundary;
        paintSpan(output.data, mask.width, y, boundary, edge.x, true, expands ? 1 : 0);
        if (!expands) output.data[y * mask.width + edge.x] = 1;
      }
    }
    for (let x = 0; x < mask.width; x += 2) {
      let top = -1; let bottom = -1;
      for (let y = 0; y < mask.height; y += 1) if (mask.data[y * mask.width + x]) { top = y; break; }
      for (let y = mask.height - 1; y >= 0; y -= 1) if (mask.data[y * mask.width + x]) { bottom = y; break; }
      if (top < 0 || bottom < 0) continue;
      for (const boundary of [top, bottom]) {
        const edge = nearestEdge(edgeMap, x, boundary, 0, 1, limit);
        if (!edge || edge.y === boundary) continue;
        const expands = boundary === top ? edge.y < boundary : edge.y > boundary;
        paintSpan(output.data, mask.width, x, boundary, edge.y, false, expands ? 1 : 0);
        if (!expands) output.data[edge.y * mask.width + x] = 1;
      }
    }
    return output;
  }
}
