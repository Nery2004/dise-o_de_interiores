import type { WallDetectionPoint } from "@/lib/wallDetection/types";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

export function cloneMask(mask: BinaryMask): BinaryMask {
  return { width: mask.width, height: mask.height, data: mask.data.slice() };
}

export function normalizeMask(mask: BinaryMask): BinaryMask {
  return { width: mask.width, height: mask.height, data: Uint8Array.from(mask.data, (value) => value ? 1 : 0) };
}

export function countMaskPixels(mask: BinaryMask) {
  let count = 0;
  for (const value of mask.data) count += value ? 1 : 0;
  return count;
}

export function morphMask(mask: BinaryMask, radius: number, operation: "dilate" | "erode"): BinaryMask {
  const safeRadius = Math.max(0, Math.floor(radius));
  if (!safeRadius) return cloneMask(mask);
  const output = new Uint8Array(mask.data.length);
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      let value = operation === "erode" ? 1 : 0;
      outer: for (let oy = -safeRadius; oy <= safeRadius; oy += 1) {
        for (let ox = -safeRadius; ox <= safeRadius; ox += 1) {
          if (ox * ox + oy * oy > safeRadius * safeRadius) continue;
          const nx = x + ox;
          const ny = y + oy;
          const sample = nx >= 0 && ny >= 0 && nx < mask.width && ny < mask.height
            ? mask.data[ny * mask.width + nx]
            : 0;
          if (operation === "dilate" && sample) { value = 1; break outer; }
          if (operation === "erode" && !sample) { value = 0; break outer; }
        }
      }
      output[y * mask.width + x] = value;
    }
  }
  return { ...mask, data: output };
}

export function applyExclusions(mask: BinaryMask, exclusions: BinaryMask[] = []): BinaryMask {
  const output = cloneMask(mask);
  for (const exclusion of exclusions) {
    if (exclusion.width !== mask.width || exclusion.height !== mask.height) continue;
    for (let index = 0; index < output.data.length; index += 1) {
      if (exclusion.data[index]) output.data[index] = 0;
    }
  }
  return output;
}

export type MaskComponent = {
  pixels: number[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

export function findComponents(mask: BinaryMask, target: 0 | 1 = 1): MaskComponent[] {
  const visited = new Uint8Array(mask.data.length);
  const components: MaskComponent[] = [];
  for (let start = 0; start < mask.data.length; start += 1) {
    if ((mask.data[start] ? 1 : 0) !== target || visited[start]) continue;
    const pixels: number[] = [];
    const queue = [start];
    const bounds = { minX: mask.width, minY: mask.height, maxX: 0, maxY: 0 };
    visited[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      const x = index % mask.width;
      const y = Math.floor(index / mask.width);
      pixels.push(index);
      bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= mask.width || ny >= mask.height) continue;
        const next = ny * mask.width + nx;
        if (!visited[next] && (mask.data[next] ? 1 : 0) === target) { visited[next] = 1; queue.push(next); }
      }
    }
    components.push({ pixels, bounds });
  }
  return components.sort((first, second) => second.pixels.length - first.pixels.length);
}

export function maskFromComponents(mask: BinaryMask, components: MaskComponent[]): BinaryMask {
  const data = new Uint8Array(mask.data.length);
  for (const component of components) for (const index of component.pixels) data[index] = 1;
  return { width: mask.width, height: mask.height, data };
}

export function isBoundaryPixel(mask: BinaryMask, x: number, y: number) {
  const value = mask.data[y * mask.width + x];
  return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) =>
    nx < 0 || ny < 0 || nx >= mask.width || ny >= mask.height || mask.data[ny * mask.width + nx] !== value);
}

export function rasterizePolygon(width: number, height: number, points: WallDetectionPoint[]): BinaryMask {
  const data = new Uint8Array(width * height);
  if (points.length < 3) return { width, height, data };
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    let inside = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
      const a = points[index]; const b = points[previous];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1e-9) + a.x) inside = !inside;
    }
    if (inside) data[y * width + x] = 1;
  }
  return { width, height, data };
}
