import { maskHasExportableColor } from "@/lib/mask-geometry";
import { createCanvas, createFinalMaskCanvas, paintAlphaCanvas } from "@/lib/masks/maskCompositor";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";

const blendModeMap: Record<BlendMode, GlobalCompositeOperation> = {
  normal: "source-over",
  multiply: "multiply",
  color: "color",
  overlay: "overlay",
};

type ExportImageOptions = {
  image: LoadedImage;
  masks: WallMask[];
  globalBlendMode: BlendMode;
};

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed."));
    image.src = src;
  });
}

function supportedCompositeOperation(
  context: CanvasRenderingContext2D,
  operation: GlobalCompositeOperation,
) {
  context.globalCompositeOperation = "source-over";
  context.globalCompositeOperation = operation;

  if (context.globalCompositeOperation !== operation) {
    return "source-over";
  }

  return operation;
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas export failed."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export async function exportEditedImage({
  globalBlendMode,
  image,
  masks,
}: ExportImageOptions) {
  const sourceImage = await loadCanvasImage(image.url);
  const canvas = document.createElement("canvas");
  canvas.width = image.dimensions.width;
  canvas.height = image.dimensions.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context unavailable.");
  }

  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  masks.filter(maskHasExportableColor).forEach((mask) => {
    if (!mask.color) {
      return;
    }

    const alphaCanvas = createFinalMaskCanvas(mask, image.dimensions);
    const colorCanvas = createCanvas(image.dimensions);
    const colorContext = colorCanvas.getContext("2d");
    if (!colorContext) return;
    paintAlphaCanvas(colorContext, alphaCanvas, mask.color);

    const operation = blendModeMap[mask.blendMode ?? globalBlendMode];

    context.save();
    context.globalAlpha = mask.opacity;
    context.globalCompositeOperation = supportedCompositeOperation(
      context,
      operation,
    );
    context.drawImage(colorCanvas, 0, 0);
    context.restore();
  });

  return canvasToPngBlob(canvas);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
