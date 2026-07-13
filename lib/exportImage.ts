import { renderPaintScene } from "@/lib/paint/CanvasRenderer";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";
import { renderPlacedDecorObjects } from "@/lib/decor/renderPlacedDecorObjects";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { RoomLightProfile } from "@/types/lighting";
import type { PlacementSurface } from "@/types/perspective";
import { beginPerformanceMeasure } from "@/lib/performance/performanceMonitor";
import { EditorError } from "@/lib/errors/editorError";

type ExportImageOptions = {
  image: LoadedImage;
  masks: WallMask[];
  globalBlendMode: BlendMode;
  placedObjects?: PlacedDecorObject[];
  roomLightProfiles?: RoomLightProfile[];
  placementSurfaces?: PlacementSurface[];
  includeOriginal?: boolean;
  signal?: AbortSignal;
  onProgress?: (stage: "preparing" | "paint" | "objects" | "encoding", progress: number) => void;
};

export function estimateExportMemory(width: number, height: number) {
  return width * height * 20;
}

export function validateExportDimensions(width: number, height: number) {
  const maximumDimension = 16_384;
  const maximumEstimatedBytes = 1024 * 1024 * 1024;
  if (width <= 0 || height <= 0 || width > maximumDimension || height > maximumDimension || estimateExportMemory(width, height) > maximumEstimatedBytes)
    throw new EditorError("EXPORT_TOO_LARGE");
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new EditorError("EXPORT_FAILED"));
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
  placedObjects = [],
  roomLightProfiles = [],
  placementSurfaces = [],
  includeOriginal = true,
  signal,
  onProgress,
}: ExportImageOptions) {
  const finishMeasure = beginPerformanceMeasure("export");
  let canvas: HTMLCanvasElement | null = null;
  try {
    validateExportDimensions(image.dimensions.width, image.dimensions.height);
    if (signal?.aborted) throw new DOMException("Exportación cancelada", "AbortError");
    onProgress?.("preparing", 0.05);
    canvas = document.createElement("canvas");
    onProgress?.("paint", 0.15);
    await renderPaintScene({
      canvas,
      globalBlendMode,
      image,
      includeOriginal,
      masks,
      qualityOverride: "ultra",
      signal,
    });
    if (signal?.aborted) throw new DOMException("Exportación cancelada", "AbortError");
    onProgress?.("objects", 0.7);
    const context = canvas.getContext("2d");
    if (!context) throw new EditorError("EXPORT_FAILED");
    const failures = await renderPlacedDecorObjects(context, placedObjects, {
      profiles: roomLightProfiles,
      surfaces: placementSurfaces,
      quality: "ultra",
    });
    if (failures.length) throw new EditorError("ASSET_LOAD_FAILED");
    if (signal?.aborted) throw new DOMException("Exportación cancelada", "AbortError");
    onProgress?.("encoding", 0.9);
    const blob = await canvasToPngBlob(canvas);
    if (signal?.aborted) throw new DOMException("Exportación cancelada", "AbortError");
    onProgress?.("encoding", 1);
    return blob;
  } finally {
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
    finishMeasure();
  }
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
