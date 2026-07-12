"use client";

import { useDecorPlacement } from "@/components/decor-placement-context";
import { getObjectStatistics, objectsWithColor } from "@/lib/decor/objectStatistics";

export function ObjectStatisticsPanel() {
  const placement = useDecorPlacement();
  const stats = getObjectStatistics(placement.placedObjects, placement.objectGroups);
  return <section className="mt-4 rounded-lg border bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#69717d]">Estadísticas</p><dl className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]"><div><dd className="text-lg font-semibold">{stats.objectCount}</dd><dt>Objetos</dt></div><div><dd className="text-lg font-semibold">{stats.groupCount}</dd><dt>Grupos</dt></div><div><dd className="text-lg font-semibold">{stats.categoryCount}</dd><dt>Categorías</dt></div><div><dd className="font-semibold">{stats.hiddenCount}</dd><dt>Ocultos</dt></div><div><dd className="font-semibold">{stats.lockedCount}</dd><dt>Bloqueados</dt></div></dl><div className="mt-3 flex flex-wrap gap-1">{stats.predominantColors.map((color) => <button key={color} type="button" title={`Seleccionar objetos ${color}`} aria-label={`Seleccionar objetos del color ${color}`} onClick={() => placement.selectPlacedObjects(objectsWithColor(placement.placedObjects, color))} className="h-7 w-7 rounded-full border border-black/15" style={{ backgroundColor: color }} />)}</div></section>;
}
