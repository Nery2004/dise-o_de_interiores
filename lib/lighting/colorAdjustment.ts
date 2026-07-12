import { clamp } from "@/lib/lighting/lightProfile";
import { applyObjectColorAdjustments, type ObjectColorAdjustments } from "@/lib/lighting/pixelAdjustment";
export { applyObjectColorAdjustments, type ObjectColorAdjustments } from "@/lib/lighting/pixelAdjustment";

function sharpen(context: CanvasRenderingContext2D, amount: number) {
  if (amount <= 0) return;
  const { width, height } = context.canvas;
  const original = context.getImageData(0, 0, width, height);
  const source = new Uint8ClampedArray(original.data);
  const strength = clamp(amount / 100, 0, 0.55);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const offset = (y * width + x) * 4;
      if (source[offset + 3] === 0) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        const average = (source[offset - 4 + channel] + source[offset + 4 + channel] + source[offset - width * 4 + channel] + source[offset + width * 4 + channel]) / 4;
        original.data[offset + channel] = clamp(source[offset + channel] + (source[offset + channel] - average) * strength, 0, 255);
      }
    }
  }
  context.putImageData(original, 0, 0);
}

export function processObjectCanvas(
  image: CanvasImageSource,
  width: number,
  height: number,
  settings: ObjectColorAdjustments,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  const blur = clamp(settings.depthBlur + Math.max(0, -settings.sharpness) * 0.025, 0, 6);
  context.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
  const inset = Math.ceil(blur * 2);
  context.drawImage(image, inset, inset, Math.max(1, canvas.width - inset * 2), Math.max(1, canvas.height - inset * 2));
  context.filter = "none";
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  context.putImageData(applyObjectColorAdjustments(imageData, settings), 0, 0);
  sharpen(context, settings.sharpness);
  return canvas;
}

export async function processObjectCanvasAsync(
  image: CanvasImageSource,
  width: number,
  height: number,
  settings: ObjectColorAdjustments,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  const blur = clamp(settings.depthBlur + Math.max(0, -settings.sharpness) * 0.025, 0, 6);
  context.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
  const inset = Math.ceil(blur * 2);
  context.drawImage(image, inset, inset, Math.max(1, canvas.width - inset * 2), Math.max(1, canvas.height - inset * 2));
  context.filter = "none";
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { applyObjectColorAdjustmentsOffThread } = await import("@/lib/lighting/lightingWorkerClient");
  const adjusted = await applyObjectColorAdjustmentsOffThread(imageData, settings);
  context.putImageData(adjusted ?? applyObjectColorAdjustments(imageData, settings), 0, 0);
  sharpen(context, settings.sharpness);
  return canvas;
}
