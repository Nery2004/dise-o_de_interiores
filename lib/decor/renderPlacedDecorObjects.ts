import { loadDecorAsset } from "@/lib/decor/loadDecorAsset";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { renderProjectiveImage } from "@/lib/perspective/projectiveTransform";
import { validatePerspectivePoints } from "@/lib/perspective/perspectiveValidation";

export async function renderPlacedDecorObjects(
  context: CanvasRenderingContext2D,
  objects: PlacedDecorObject[],
) {
  const visible = [...objects]
    .filter((object) => object.visible && object.opacity > 0)
    .sort((first, second) => first.zIndex - second.zIndex);
  const loaded = await Promise.all(
    visible.map(async (object) => {
      try {
        return {
          object,
          image: await loadDecorAsset(object.assetUrl),
          failed: false as const,
        };
      } catch {
        return { object, image: null, failed: true as const };
      }
    }),
  );
  for (const item of loaded) {
    if (!item.image) continue;
    const { object } = item;
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, object.opacity));
    if (
      object.perspectiveMode !== "none" &&
      object.perspectivePoints &&
      validatePerspectivePoints(object.perspectivePoints)
    ) {
      const source = document.createElement("canvas");
      source.width = Math.max(1, Math.round(object.width));
      source.height = Math.max(1, Math.round(object.height));
      const sourceContext = source.getContext("2d");
      if (sourceContext) {
        sourceContext.translate(
          object.flipX ? source.width : 0,
          object.flipY ? source.height : 0,
        );
        sourceContext.scale(object.flipX ? -1 : 1, object.flipY ? -1 : 1);
        sourceContext.drawImage(item.image, 0, 0, source.width, source.height);
        renderProjectiveImage(
          context,
          source,
          source.width,
          source.height,
          object.perspectivePoints,
          "ultra",
        );
      }
    } else {
      context.translate(object.x, object.y);
      context.rotate((object.rotation * Math.PI) / 180);
      context.scale(object.flipX ? -1 : 1, object.flipY ? -1 : 1);
      context.drawImage(
        item.image,
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
