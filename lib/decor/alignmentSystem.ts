import type { ObjectAlignment, ObjectDistribution } from "@/types/object-group";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function alignObjects(objects: PlacedDecorObject[], alignment: ObjectAlignment) {
  if (objects.length < 2) return objects;
  const left = Math.min(...objects.map((item) => item.x - item.width / 2));
  const right = Math.max(...objects.map((item) => item.x + item.width / 2));
  const top = Math.min(...objects.map((item) => item.y - item.height / 2));
  const bottom = Math.max(...objects.map((item) => item.y + item.height / 2));
  const reference = objects[0];
  return objects.map((object) => {
    if (alignment === "left") return { ...object, x: left + object.width / 2 };
    if (alignment === "center-x") return { ...object, x: (left + right) / 2 };
    if (alignment === "right") return { ...object, x: right - object.width / 2 };
    if (alignment === "top") return { ...object, y: top + object.height / 2 };
    if (alignment === "center-y") return { ...object, y: (top + bottom) / 2 };
    if (alignment === "bottom") return { ...object, y: bottom - object.height / 2 };
    if (alignment === "same-width") return { ...object, width: reference.width, scaleX: reference.width / object.originalWidth };
    return { ...object, height: reference.height, scaleY: reference.height / object.originalHeight };
  });
}

export function distributeObjects(objects: PlacedDecorObject[], direction: ObjectDistribution) {
  if (objects.length < 3) return objects;
  const key = direction === "horizontal" ? "x" : "y";
  const sorted = [...objects].sort((a, b) => a[key] - b[key]);
  const start = sorted[0][key];
  const step = (sorted.at(-1)![key] - start) / (sorted.length - 1);
  return sorted.map((object, index) => ({ ...object, [key]: start + step * index }));
}

export function getSmartGuides(moving: PlacedDecorObject, objects: PlacedDecorObject[], tolerance = 6) {
  const guides: Array<{ axis: "x" | "y"; value: number; label: string }> = [];
  for (const object of objects) {
    if (object.id === moving.id || !object.visible) continue;
    if (Math.abs(object.x - moving.x) <= tolerance) guides.push({ axis: "x", value: object.x, label: "Centro" });
    if (Math.abs(object.y - moving.y) <= tolerance) guides.push({ axis: "y", value: object.y, label: "Centro" });
    if (Math.abs(object.height - moving.height) <= tolerance) guides.push({ axis: "y", value: moving.y - moving.height / 2, label: "Misma altura" });
  }
  return guides.slice(0, 4);
}
