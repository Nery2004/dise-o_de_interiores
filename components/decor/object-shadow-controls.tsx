"use client";

import { useDecorPlacement } from "@/components/decor-placement-context";
import { LightingSlider } from "@/components/decor/lighting-slider";
import { defaultShadowForCategory } from "@/lib/lighting/lightProfile";
import { categoryForPlacedObject } from "@/lib/perspective/objectAnchoring";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function ObjectShadowControls({ object }: { object: PlacedDecorObject }) {
  const placement = useDecorPlacement();
  const settings = object.shadowSettings ?? defaultShadowForCategory(categoryForPlacedObject(object), object.surfaceType);
  const update = (changes: Partial<typeof settings>, history = false) =>
    placement.updatePlacedObject(object.id, { shadowSettings: { ...settings, ...changes } }, history);
  const slider = (key: keyof typeof settings, value: number) => update({ [key]: value }, false);
  return (
    <section className="mt-4 border-t border-[#dfe3e8] pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#69717d]">Sombra</p>
        <button type="button" onClick={() => placement.updatePlacedObject(object.id, { shadowSettings: defaultShadowForCategory(categoryForPlacedObject(object), object.surfaceType) })} className="text-[10px] font-semibold text-[#2563eb]">Restablecer sombra</button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#5f6670]">
        <input type="checkbox" checked={settings.enabled} onChange={(event) => update({ enabled: event.target.checked }, true)} />
        Activar sombra
      </label>
      <label className="mt-3 block text-xs font-semibold text-[#5f6670]">
        Tipo
        <select value={settings.type} disabled={!settings.enabled} onChange={(event) => update({ type: event.target.value as typeof settings.type }, true)} className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs">
          <option value="contact">Contacto</option><option value="projected">Proyectada</option><option value="both">Ambas</option>
        </select>
      </label>
      <div className="mt-3 space-y-3">
        <LightingSlider label="Opacidad" value={settings.opacity * 100} minimum={0} maximum={60} unit="%" disabled={!settings.enabled} onBegin={placement.beginHistoryTransaction} onChange={(value) => slider("opacity", value / 100)} onCommit={placement.commitHistoryTransaction} onReset={() => update({ opacity: 0 }, true)} />
        <LightingSlider label="Desenfoque" value={settings.blur} minimum={0} maximum={40} unit=" px" disabled={!settings.enabled} onBegin={placement.beginHistoryTransaction} onChange={(value) => slider("blur", value)} onCommit={placement.commitHistoryTransaction} onReset={() => update({ blur: 0 }, true)} />
        <LightingSlider label="Contacto" value={settings.contactOpacity * 100} minimum={0} maximum={60} unit="%" disabled={!settings.enabled} onBegin={placement.beginHistoryTransaction} onChange={(value) => slider("contactOpacity", value / 100)} onCommit={placement.commitHistoryTransaction} onReset={() => update({ contactOpacity: 0 }, true)} />
      </div>
      <details className="mt-3 rounded-md border bg-white p-2">
        <summary className="cursor-pointer text-xs font-semibold">Más ajustes</summary>
        <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={settings.autoDirection} onChange={(event) => update({ autoDirection: event.target.checked }, true)} />Dirección automática</label>
        <div className="mt-3 space-y-3">
          {([
            ["Offset X", "offsetX", -200, 200], ["Offset Y", "offsetY", -200, 200],
            ["Escala X", "scaleX", 0.1, 3], ["Escala Y", "scaleY", 0.1, 3],
            ["Rotación", "rotation", -180, 180], ["Blur de contacto", "contactBlur", 0, 30],
            ["Ancho de contacto", "contactWidth", 0.05, 1.5], ["Alto de contacto", "contactHeight", 0.01, 0.4],
          ] as const).map(([label, key, min, max]) => <LightingSlider key={key} label={label} value={settings[key]} minimum={min} maximum={max} step={max <= 3 ? 0.01 : 1} disabled={!settings.enabled || (settings.autoDirection && (key === "offsetX" || key === "offsetY"))} onBegin={placement.beginHistoryTransaction} onChange={(value) => slider(key, value)} onCommit={placement.commitHistoryTransaction} onReset={() => update({ [key]: key.startsWith("scale") ? 1 : 0 }, true)} />)}
        </div>
        <label className="mt-3 block text-xs font-semibold">Color<input type="color" value={settings.color} disabled={!settings.enabled} onChange={(event) => update({ color: event.target.value }, true)} className="mt-1 h-9 w-full rounded border bg-white" /></label>
      </details>
    </section>
  );
}
