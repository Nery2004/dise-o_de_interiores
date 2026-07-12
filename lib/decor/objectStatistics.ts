import { decorObjectsById } from "@/data/decorObjects";
import type { ObjectGroup } from "@/types/object-group";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function getObjectStatistics(objects: PlacedDecorObject[], groups: ObjectGroup[]) {
  const categories = new Set(objects.map((object) => decorObjectsById.get(object.decorObjectId)?.catalogCategory).filter(Boolean));
  const colors = objects.flatMap((object) => decorObjectsById.get(object.decorObjectId)?.dominantColors ?? []);
  const counts = new Map<string, number>();
  colors.forEach((color) => counts.set(color, (counts.get(color) ?? 0) + 1));
  return {
    objectCount: objects.length,
    groupCount: groups.length,
    hiddenCount: objects.filter((object) => !object.visible).length,
    lockedCount: objects.filter((object) => object.locked).length,
    categoryCount: categories.size,
    predominantColors: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([color]) => color),
  };
}

export function objectsWithColor(objects: PlacedDecorObject[], color: string) {
  return objects.filter((object) => decorObjectsById.get(object.decorObjectId)?.dominantColors?.includes(color)).map((object) => object.id);
}
