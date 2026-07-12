"use client";

import { useState } from "react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { LightingSlider } from "@/components/decor/lighting-slider";
import { ObjectShadowControls } from "@/components/decor/object-shadow-controls";
import { useRoomLighting } from "@/components/room-lighting-context";
import { lightingDefaults } from "@/lib/lighting/lightProfile";
import { categoryForPlacedObject } from "@/lib/perspective/objectAnchoring";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

const controls = [
  ["Brillo", "brightness"], ["Contraste", "contrast"], ["Saturación", "saturation"],
  ["Temperatura", "temperature"], ["Matiz verde–magenta", "tint"], ["Exposición", "exposure"],
  ["Altas luces", "highlights"], ["Sombras", "shadows"], ["Nitidez", "sharpness"],
] as const;

export function ObjectLightingPanel({ object }: { object: PlacedDecorObject }) {
  const placement = useDecorPlacement();
  const lighting = useRoomLighting();
  const [adapting, setAdapting] = useState(false);
  const disabled = object.locked || object.lightingMode === "none";
  const updateValue = (key: (typeof controls)[number][1], value: number) => placement.updatePlacedObject(object.id, { [key]: value, lightingMode: "manual" }, false);
  const reset = () => placement.updatePlacedObject(object.id, { ...lightingDefaults(categoryForPlacedObject(object), object.surfaceType), lightingLocked: false, lightProfileId: lighting.activeProfileId });
  return (
    <section className="mt-4 border-t border-[#dfe3e8] pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#69717d]">Iluminación del objeto</p>
      <label className="mt-3 block text-xs font-semibold text-[#5f6670]">Modo
        <select value={object.lightingMode} disabled={object.locked} onChange={(event) => placement.updatePlacedObject(object.id, { lightingMode: event.target.value as PlacedDecorObject["lightingMode"] })} className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs">
          <option value="auto">Auto</option><option value="manual">Manual</option><option value="none">Ninguno</option>
        </select>
      </label>
      <button type="button" disabled={disabled || adapting} onClick={async () => { setAdapting(true); await lighting.adaptObject({ ...object, lightingMode: "auto" }); setAdapting(false); }} className="mt-3 h-9 w-full rounded-md bg-[#1f2421] px-3 text-xs font-semibold text-white disabled:opacity-40">{adapting ? "Adaptando…" : "Adaptar a la habitación"}</button>
      <div className="mt-4 space-y-3">
        {controls.slice(0, 5).map(([label, key]) => <LightingSlider key={key} label={label} value={object[key]} disabled={disabled} onBegin={placement.beginHistoryTransaction} onChange={(value) => updateValue(key, value)} onCommit={placement.commitHistoryTransaction} onReset={() => placement.updatePlacedObject(object.id, { [key]: 0, lightingMode: "manual" })} />)}
      </div>
      <details className="mt-3 rounded-md border bg-white p-2">
        <summary className="cursor-pointer text-xs font-semibold">Más ajustes</summary>
        <div className="mt-3 space-y-3">
          {controls.slice(5).map(([label, key]) => <LightingSlider key={key} label={label} value={object[key]} disabled={disabled} onBegin={placement.beginHistoryTransaction} onChange={(value) => updateValue(key, value)} onCommit={placement.commitHistoryTransaction} onReset={() => placement.updatePlacedObject(object.id, { [key]: 0, lightingMode: "manual" })} />)}
          <LightingSlider label="Desenfoque por profundidad" value={object.depthBlur} minimum={0} maximum={6} step={0.1} unit=" px" disabled={disabled || !object.adaptDepthBlur} onBegin={placement.beginHistoryTransaction} onChange={(value) => placement.updatePlacedObject(object.id, { depthBlur: value, lightingMode: "manual" }, false)} onCommit={placement.commitHistoryTransaction} onReset={() => placement.updatePlacedObject(object.id, { depthBlur: 0 })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={object.adaptDepthBlur} disabled={disabled} onChange={(event) => placement.updatePlacedObject(object.id, { adaptDepthBlur: event.target.checked })} />Adaptar desenfoque a profundidad</label>
        <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={object.adaptTexture} disabled={disabled} onChange={(event) => placement.updatePlacedObject(object.id, { adaptTexture: event.target.checked })} />Adaptar textura fotográfica</label>
        <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(object.lightingLocked)} disabled={disabled} onChange={(event) => placement.updatePlacedObject(object.id, { lightingLocked: event.target.checked })} />Bloquear ajuste individual</label>
      </details>
      <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={object.locked} onClick={reset} className="h-9 rounded-md border bg-white text-xs font-semibold disabled:opacity-40">Restablecer ajustes</button><button type="button" disabled={object.locked} onClick={() => placement.updatePlacedObject(object.id, { lightingMode: "auto", lightingLocked: false })} className="h-9 rounded-md border bg-white text-xs font-semibold disabled:opacity-40">Volver a automático</button></div>
      <ObjectShadowControls object={object} />
    </section>
  );
}
