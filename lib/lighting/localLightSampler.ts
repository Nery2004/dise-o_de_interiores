import { sampleLighting, type PixelSource } from "@/lib/lighting/roomLightAnalyzer";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function sampleRoomLightingAroundObject(
  source: PixelSource,
  object: Pick<PlacedDecorObject, "x" | "y" | "width" | "height" | "depth" | "surfaceType">,
) {
  const padding = 0.22 + object.depth * 0.18;
  const width = Math.max(24, object.width * (1 + padding * 2));
  const height = Math.max(24, object.height * (1 + padding * 2));
  // The source is always the untouched room image, so the placed asset is never sampled.
  return sampleLighting(source, {
    x: object.x - width / 2,
    y: object.y - height / 2,
    width,
    height,
  });
}
