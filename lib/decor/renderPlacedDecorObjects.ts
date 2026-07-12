import { loadDecorAsset } from "@/lib/decor/loadDecorAsset";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export async function renderPlacedDecorObjects(context: CanvasRenderingContext2D, objects: PlacedDecorObject[]) {
  const visible = [...objects].filter((object) => object.visible && object.opacity > 0).sort((first, second) => first.zIndex - second.zIndex);
  const loaded = await Promise.all(visible.map(async (object) => {
    try { return { object, image: await loadDecorAsset(object.assetUrl), failed: false as const }; }
    catch { return { object, image: null, failed: true as const }; }
  }));
  for (const item of loaded) {
    if (!item.image) continue;
    const { object } = item;
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, object.opacity));
    context.translate(object.x, object.y);
    context.rotate(object.rotation * Math.PI / 180);
    context.scale(object.flipX ? -1 : 1, object.flipY ? -1 : 1);
    context.drawImage(item.image, -object.width / 2, -object.height / 2, object.width, object.height);
    context.restore();
  }
  return loaded.filter((item) => item.failed).map((item) => item.object.id);
}
