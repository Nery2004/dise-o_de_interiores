import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { renderProjectiveImage } from "@/lib/perspective/projectiveTransform";
import { validatePerspectivePoints } from "@/lib/perspective/perspectiveValidation";
import { renderDecorObjectAsset } from "@/lib/lighting/DecorObjectRenderPipeline";
import { createContactShadow } from "@/lib/lighting/contactShadow";
import { createProjectedShadow } from "@/lib/lighting/projectedShadow";
import type { RenderQuality } from "@/types/editor";
import type { RoomLightProfile } from "@/types/lighting";
import type { PlacementSurface } from "@/types/perspective";

function shadowSilhouette(source: HTMLCanvasElement, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(source, 0, 0);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function renderObjectShadows(
  context: CanvasRenderingContext2D,
  object: PlacedDecorObject,
  source: HTMLCanvasElement,
  surface: PlacementSurface | undefined,
  profile: RoomLightProfile | undefined,
  quality: RenderQuality,
) {
  const contact = createContactShadow(object, surface, profile);
  if (contact) {
    context.save();
    context.globalAlpha = contact.opacity * object.opacity;
    context.fillStyle = contact.color;
    context.filter = quality === "draft" ? "blur(3px)" : `blur(${contact.blur}px)`;
    context.translate(contact.center.x, contact.center.y);
    context.rotate((contact.rotation * Math.PI) / 180);
    context.beginPath();
    context.ellipse(0, 0, contact.width / 2, contact.height / 2, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  const projected = createProjectedShadow(object, surface, profile);
  if (!projected) return;
  const silhouette = shadowSilhouette(source, projected.color);
  context.save();
  context.globalAlpha = projected.opacity * object.opacity;
  context.filter = quality === "draft" ? "blur(4px)" : `blur(${projected.blur}px)`;
  if (object.perspectiveMode !== "none" && object.perspectivePoints) {
    const shifted = Object.fromEntries(
      Object.entries(object.perspectivePoints).map(([key, point]) => [
        key,
        { x: point.x + projected.offsetX, y: point.y + projected.offsetY },
      ]),
    ) as typeof object.perspectivePoints;
    renderProjectiveImage(context, silhouette, silhouette.width, silhouette.height, shifted, quality);
  } else {
    context.translate(object.x + projected.offsetX, object.y + projected.offsetY);
    context.rotate(((object.rotation + projected.rotation) * Math.PI) / 180);
    context.scale(projected.scaleX, projected.scaleY);
    context.drawImage(silhouette, -object.width / 2, -object.height / 2, object.width, object.height);
  }
  context.restore();
}

export async function renderPlacedDecorObjects(
  context: CanvasRenderingContext2D,
  objects: PlacedDecorObject[],
  options: {
    profiles?: RoomLightProfile[];
    surfaces?: PlacementSurface[];
    quality?: RenderQuality;
  } = {},
) {
  const quality = options.quality ?? "ultra";
  const visible = [...objects]
    .filter((object) => object.visible && object.opacity > 0)
    .sort((first, second) => first.zIndex - second.zIndex);
  const loaded = await Promise.all(
    visible.map(async (object) => {
      try {
        return {
          object,
          processed: await renderDecorObjectAsset(object, quality),
          failed: false as const,
        };
      } catch {
        return { object, processed: null, failed: true as const };
      }
    }),
  );
  for (const item of loaded) {
    if (!item.processed) continue;
    const { object } = item;
    const profile = options.profiles?.find((candidate) => candidate.id === object.lightProfileId) ?? options.profiles?.[0];
    const surface = options.surfaces?.find((candidate) => candidate.id === object.surfaceId);
    renderObjectShadows(context, object, item.processed, surface, profile, quality);
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, object.opacity));
    if (
      object.perspectiveMode !== "none" &&
      object.perspectivePoints &&
      validatePerspectivePoints(object.perspectivePoints)
    ) {
      const source = item.processed;
      if (source) {
        renderProjectiveImage(
          context,
          source,
          source.width,
          source.height,
          object.perspectivePoints,
          quality,
        );
      }
    } else {
      context.translate(object.x, object.y);
      context.rotate((object.rotation * Math.PI) / 180);
      context.drawImage(
        item.processed,
        -object.width / 2,
        -object.height / 2,
        object.width,
        object.height,
      );
    }
    context.restore();
  }
  return loaded.filter((item) => item.failed).map((item) => item.object.id);
}
