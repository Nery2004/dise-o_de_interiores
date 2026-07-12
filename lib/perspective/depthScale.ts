import type { DecorObjectCategory } from "@/types/decor-object";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

const depthRanges: Record<DecorObjectCategory, [number, number]> = {
  sillones: [0.58, 1.22],
  sillas: [0.55, 1.18],
  mesas: [0.58, 1.2],
  macetas: [0.56, 1.18],
  plantas: [0.55, 1.2],
  lamparas: [0.65, 1.1],
  alfombras: [0.48, 1.12],
  cuadros: [0.72, 1.06],
  estanterias: [0.68, 1.08],
  decoracion: [0.62, 1.12],
  camas: [0.6, 1.18],
  escritorios: [0.58, 1.18],
};

export function getPerspectiveScale(
  depth: number,
  category: DecorObjectCategory = "decoracion",
) {
  const [minimum, maximum] = depthRanges[category];
  const normalized = Math.max(0, Math.min(1, depth));
  return minimum + (maximum - minimum) * normalized;
}

export function sortObjectsByDepth(objects: PlacedDecorObject[]) {
  const manual = objects
    .filter((object) => object.zOrderMode === "manual")
    .sort((a, b) => a.zIndex - b.zIndex);
  const automatic = objects
    .filter((object) => object.zOrderMode === "depth")
    .sort(
      (a, b) => a.depth - b.depth || a.createdAt.localeCompare(b.createdAt),
    );
  const ordered = [...manual, ...automatic];
  return ordered.map((object, index) => ({ ...object, zIndex: index }));
}
