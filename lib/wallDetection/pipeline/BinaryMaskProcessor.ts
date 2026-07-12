import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

function morph(mask: BinaryMask, radius: number, operation: "dilate" | "erode"): BinaryMask {
  if (radius <= 0) return { ...mask, data: mask.data.slice() };
  const output = new Uint8Array(mask.data.length);
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      let value = operation === "erode" ? 1 : 0;
      outer: for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
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
  return { width: mask.width, height: mask.height, data: output };
}

function subtractExclusions(mask: BinaryMask, exclusions: BinaryMask[]): BinaryMask {
  const data = mask.data.slice();
  for (const exclusion of exclusions) {
    if (exclusion.width !== mask.width || exclusion.height !== mask.height) continue;
    for (let index = 0; index < data.length; index += 1) if (exclusion.data[index]) data[index] = 0;
  }
  return { ...mask, data };
}

function fillHoles(mask: BinaryMask): BinaryMask {
  const exterior = new Uint8Array(mask.data.length);
  const queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return;
    const index = y * mask.width + x;
    if (mask.data[index] || exterior[index]) return;
    exterior[index] = 1;
    queue.push(index);
  };
  for (let x = 0; x < mask.width; x += 1) { enqueue(x, 0); enqueue(x, mask.height - 1); }
  for (let y = 0; y < mask.height; y += 1) { enqueue(0, y); enqueue(mask.width - 1, y); }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % mask.width;
    const y = Math.floor(index / mask.width);
    enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
  }
  const data = mask.data.slice();
  for (let index = 0; index < data.length; index += 1) if (!data[index] && !exterior[index]) data[index] = 1;
  return { ...mask, data };
}

export class BinaryMaskProcessor {
  process(mask: BinaryMask, smoothness: number, exclusions: BinaryMask[] = []): BinaryMask {
    const normalized = { ...mask, data: Uint8Array.from(mask.data, (value) => value > 0 ? 1 : 0) };
    const withoutExclusions = subtractExclusions(normalized, exclusions);
    const radius = Math.max(0, Math.min(3, Math.round(smoothness * 3)));
    const closed = morph(morph(withoutExclusions, radius, "dilate"), radius, "erode");
    const opened = morph(morph(closed, Math.max(0, radius - 1), "erode"), Math.max(0, radius - 1), "dilate");
    return fillHoles(opened);
  }

  connectedComponents(mask: BinaryMask, minimumArea: number): BinaryMask[] {
    const visited = new Uint8Array(mask.data.length);
    const components: BinaryMask[] = [];
    for (let start = 0; start < mask.data.length; start += 1) {
      if (!mask.data[start] || visited[start]) continue;
      const pixels: number[] = [];
      const queue = [start];
      visited[start] = 1;
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const index = queue[cursor];
        pixels.push(index);
        const x = index % mask.width;
        const y = Math.floor(index / mask.width);
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nx < 0 || ny < 0 || nx >= mask.width || ny >= mask.height) continue;
          const next = ny * mask.width + nx;
          if (mask.data[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
        }
      }
      if (pixels.length >= minimumArea) {
        const data = new Uint8Array(mask.data.length);
        for (const index of pixels) data[index] = 1;
        components.push({ width: mask.width, height: mask.height, data });
      }
    }
    return components.sort((a, b) => b.data.reduce((sum, value) => sum + value, 0) - a.data.reduce((sum, value) => sum + value, 0));
  }
}
