import { createFinalMaskCanvas } from "@/lib/masks/maskCompositor";
import { createRenderCanvas, getRenderContext } from "@/lib/paint/renderCanvas";
import type { ImageDimensions, WallMask } from "@/types/editor";
import { featherAlphaMask } from "@/lib/paint/featherAlpha";

export type MaskBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FeatheredMask = {
  alpha: Uint8ClampedArray;
  bounds: MaskBounds;
  height: number;
  width: number;
};

export function findMaskBounds(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
): MaskBounds | null {
  let minimumX = width;
  let minimumY = height;
  let maximumX = -1;
  let maximumY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] === 0) continue;
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }
  return maximumX < minimumX
    ? null
    : {
        x: minimumX,
        y: minimumY,
        width: maximumX - minimumX + 1,
        height: maximumY - minimumY + 1,
      };
}

export function applyMaskFeatherPass(
  mask: WallMask,
  dimensions: ImageDimensions,
  scale: number,
  feather: number,
): FeatheredMask | null {
  const width = Math.max(1, Math.round(dimensions.width * scale));
  const height = Math.max(1, Math.round(dimensions.height * scale));
  const sourceMask = createFinalMaskCanvas(mask, dimensions);
  const target = createRenderCanvas(width, height);
  const context = getRenderContext(target);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.drawImage(sourceMask, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const sourceAlpha = new Uint8ClampedArray(width * height);
  for (let index = 0; index < sourceAlpha.length; index += 1) {
    sourceAlpha[index] = pixels[index * 4 + 3];
  }
  const alpha = featherAlphaMask(sourceAlpha, width, height, feather * scale);
  const bounds = findMaskBounds(alpha, width, height);
  return bounds ? { alpha, bounds, height, width } : null;
}
