import { exportEditedImage } from "@/lib/exportImage";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { RoomLightProfile } from "@/types/lighting";
import type { PlacementSurface } from "@/types/perspective";

export async function createProjectThumbnail(image: LoadedImage, masks: WallMask[], globalBlendMode: BlendMode, placedObjects: PlacedDecorObject[] = [], roomLightProfiles: RoomLightProfile[] = [], placementSurfaces: PlacementSurface[] = []) {
  const blob = await exportEditedImage({ image, masks, globalBlendMode, placedObjects, roomLightProfiles, placementSurfaces });
  const url = URL.createObjectURL(blob);
  try {
    const source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = url;
    });
    const width = Math.min(480, source.naturalWidth);
    const height = Math.round((width / source.naturalWidth) * source.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(source, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(url);
  }
}
