import type { EdgeMap } from "@/lib/wallDetection/pipeline/types";

export class ImageEdgeAnalyzer {
  async analyze(imageBuffer: Buffer, width: number, height: number): Promise<EdgeMap | null> {
    try {
      const sharp = (await import("sharp")).default;
      const { data, info } = await sharp(imageBuffer)
        .resize(width, height, { fit: "fill" })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const luminance = Uint8Array.from(data);
      const magnitude = new Uint8Array(info.width * info.height);
      let sum = 0;
      let sumSquares = 0;
      let samples = 0;
      const sample = (x: number, y: number) => luminance[y * info.width + x];
      for (let y = 1; y < info.height - 1; y += 1) for (let x = 1; x < info.width - 1; x += 1) {
        const gx = -sample(x - 1, y - 1) + sample(x + 1, y - 1) - 2 * sample(x - 1, y) + 2 * sample(x + 1, y) - sample(x - 1, y + 1) + sample(x + 1, y + 1);
        const gy = -sample(x - 1, y - 1) - 2 * sample(x, y - 1) - sample(x + 1, y - 1) + sample(x - 1, y + 1) + 2 * sample(x, y + 1) + sample(x + 1, y + 1);
        const value = Math.min(255, Math.round(Math.hypot(gx, gy) / 4));
        magnitude[y * info.width + x] = value;
        sum += value; sumSquares += value * value; samples += 1;
      }
      const mean = samples ? sum / samples : 0;
      const deviation = samples ? Math.sqrt(Math.max(0, sumSquares / samples - mean * mean)) : 0;
      return { width: info.width, height: info.height, magnitude, luminance, threshold: Math.max(36, Math.min(180, Math.round(mean + deviation * 1.2))) };
    } catch {
      return null;
    }
  }
}
