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
};

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
}: ExportImageOptions) {
  const finishMeasure = beginPerformanceMeasure("export");
  try {
    const canvas = document.createElement("canvas");
    await renderPaintScene({
      canvas,
      globalBlendMode,
      image,
      includeOriginal,
      masks,
      qualityOverride: "ultra",
    });
    const context = canvas.getContext("2d");
    if (!context) throw new EditorError("EXPORT_FAILED");
    const failures = await renderPlacedDecorObjects(context, placedObjects, {
      profiles: roomLightProfiles,
      surfaces: placementSurfaces,
      quality: "ultra",
    });
    if (failures.length) throw new EditorError("ASSET_LOAD_FAILED");
    return await canvasToPngBlob(canvas);
  } finally {
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
