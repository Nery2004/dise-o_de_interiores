import { renderPaintScene } from "@/lib/paint/CanvasRenderer";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";

type ExportImageOptions = {
  image: LoadedImage;
  masks: WallMask[];
  globalBlendMode: BlendMode;
};

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
  const canvas = document.createElement("canvas");
  await renderPaintScene({
    canvas,
    globalBlendMode,
    image,
    includeOriginal: true,
    masks,
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
