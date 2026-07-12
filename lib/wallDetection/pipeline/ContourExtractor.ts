import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

type Edge = { start: WallDetectionPoint; end: WallDetectionPoint };
const key = (point: WallDetectionPoint) => `${point.x},${point.y}`;

function signedArea(points: WallDetectionPoint[]) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

export class ContourExtractor {
  extract(mask: BinaryMask): WallDetectionPoint[] {
    const edges: Edge[] = [];
    const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < mask.width && y < mask.height && mask.data[y * mask.width + x] > 0;
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < mask.width; x += 1) {
        if (!filled(x, y)) continue;
        if (!filled(x, y - 1)) edges.push({ start: { x, y }, end: { x: x + 1, y } });
        if (!filled(x + 1, y)) edges.push({ start: { x: x + 1, y }, end: { x: x + 1, y: y + 1 } });
        if (!filled(x, y + 1)) edges.push({ start: { x: x + 1, y: y + 1 }, end: { x, y: y + 1 } });
        if (!filled(x - 1, y)) edges.push({ start: { x, y: y + 1 }, end: { x, y } });
      }
    }
    const outgoing = new Map<string, Edge[]>();
    for (const edge of edges) outgoing.set(key(edge.start), [...(outgoing.get(key(edge.start)) ?? []), edge]);
    const used = new Set<Edge>();
    const loops: WallDetectionPoint[][] = [];
    for (const initial of edges) {
      if (used.has(initial)) continue;
      const loop = [initial.start];
      let edge: Edge | undefined = initial;
      while (edge && !used.has(edge)) {
        used.add(edge);
        loop.push(edge.end);
        if (key(edge.end) === key(initial.start)) break;
        edge = outgoing.get(key(edge.end))?.find((candidate) => !used.has(candidate));
      }
      if (loop.length >= 4 && key(loop[0]) === key(loop[loop.length - 1])) loops.push(loop.slice(0, -1));
    }
    return loops.sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)))[0] ?? [];
  }
}
