"use client";

import { useDecorPlacement } from "@/components/decor-placement-context";
import { decorObjects, decorObjectsById } from "@/data/decorObjects";
import { decorCollectionLabels, premiumDecorCategoryLabels } from "@/types/decor-object";

export function ProfessionalObjectInspector() {
  const placement = useDecorPlacement();
  const object = placement.placedObjects.find((item) => item.id === placement.selectedObjectId);
  const catalog = object ? decorObjectsById.get(object.decorObjectId) : undefined;
  if (!object || !catalog) return null;
  const variants = catalog.variants ?? [];
  const similar = decorObjects.filter((item) => item.id !== catalog.id && (item.catalogCategory === catalog.catalogCategory || item.style === catalog.style)).slice(0, 12);
  return <section className="mt-4 border-t border-[#e1e5ea] pt-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69717d]">Inspector profesional</p><dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg border bg-white p-3 text-[10px]"><div><dt className="text-[#7a8290]">Categoría</dt><dd className="font-semibold">{premiumDecorCategoryLabels[catalog.catalogCategory]}</dd></div><div><dt className="text-[#7a8290]">Medida aprox.</dt><dd className="font-semibold">{(catalog.approximateWidthCm / 100).toFixed(2)} × {(catalog.approximateHeightCm / 100).toFixed(2)} m</dd></div><div className="col-span-2"><dt className="text-[#7a8290]">Colecciones</dt><dd className="font-semibold">{catalog.collectionIds.map((id) => decorCollectionLabels[id]).join(" · ")}</dd></div><div><dt className="text-[#7a8290]">Profundidad</dt><dd>{Math.round(object.depth * 100)}%</dd></div><div><dt className="text-[#7a8290]">Perspectiva</dt><dd>{object.perspectiveMode}</dd></div></dl>
    <label className="mt-3 block text-[11px] font-semibold">Etiquetas<input defaultValue={object.tags.join(", ")} placeholder="Cliente, Comprar, Pendiente" onBlur={(event) => placement.updatePlacedObject(object.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 30) })} className="mt-1 h-9 w-full rounded border px-2 text-xs" /></label>
    <div className="mt-3 grid grid-cols-3 gap-1"><button onClick={() => placement.scaleSelectedObjects(0.8)} className="h-8 rounded border bg-white text-[10px]">Pequeño</button><button onClick={() => placement.scaleSelectedObjects(1)} className="h-8 rounded border bg-white text-[10px]">Mediano</button><button onClick={() => placement.scaleSelectedObjects(1.2)} className="h-8 rounded border bg-white text-[10px]">Grande</button></div>
    {variants.length ? <label className="mt-3 block text-[11px] font-semibold">Cambiar variante<select defaultValue="" onChange={(event) => { const replacement = decorObjectsById.get(event.target.value); if (replacement) placement.replacePlacedObjectAsset(object.id, replacement); }} className="mt-1 h-9 w-full rounded border bg-white px-2 text-xs"><option value="">Selecciona variante…</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select></label> : null}
    <label className="mt-3 block text-[11px] font-semibold">Reemplazar / buscar similares<select defaultValue="" onChange={(event) => { const replacement = decorObjectsById.get(event.target.value); if (replacement) placement.replacePlacedObjectAsset(object.id, replacement); }} className="mt-1 h-9 w-full rounded border bg-white px-2 text-xs"><option value="">Mantener objeto…</option>{similar.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <details className="mt-3 rounded border bg-white p-2"><summary className="cursor-pointer text-[11px] font-semibold">Historial</summary><p className="mt-2 text-[10px] text-[#69717d]">Nombre, etiquetas, reemplazo, variante, iluminación, grupo y transformación forman parte de Deshacer/Rehacer.</p></details>
  </section>;
}
