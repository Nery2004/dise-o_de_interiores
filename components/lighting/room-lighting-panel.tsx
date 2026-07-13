"use client";

import { useRoomLighting } from "@/components/room-lighting-context";
import { LightingSlider } from "@/components/decor/lighting-slider";
import type { RoomLightProfile } from "@/types/lighting";
import { FeatureFlags } from "@/config/featureFlags";

const controls: Array<[string, keyof Pick<RoomLightProfile, "elevation" | "intensity" | "temperature" | "ambientBrightness" | "ambientContrast" | "shadowStrength" | "shadowSoftness">, number, number]> = [
  ["Altura de la luz", "elevation", 0, 90], ["Intensidad", "intensity", 0, 100],
  ["Temperatura", "temperature", -100, 100], ["Luz ambiental", "ambientBrightness", -100, 100],
  ["Contraste ambiental", "ambientContrast", -100, 100], ["Fuerza de sombra", "shadowStrength", 0, 100],
  ["Suavidad", "shadowSoftness", 0, 100],
];

export function RoomLightingPanel() {
  const lighting = useRoomLighting();
  const profile = lighting.activeProfile;
  if (!FeatureFlags.automaticLighting) {
    return (
      <section className="mb-5 rounded-md border border-[#dfe3e8] bg-[#fafbfc] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69717d]">Iluminación automática</p>
        <p className="mt-2 text-xs leading-5 text-[#69717d]">Experimental y deshabilitada por defecto en esta versión candidata.</p>
      </section>
    );
  }
  return (
    <section className="mb-5 rounded-md border border-[#dfe3e8] bg-[#fafbfc] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69717d]">Iluminación de la habitación</p>
      {lighting.profiles.length ? <label className="mt-3 block text-xs font-semibold text-[#5f6670]">Perfil activo<select value={lighting.activeProfileId} onChange={(event) => lighting.setActiveProfileId(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs">{lighting.profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <p className="mt-2 text-xs text-[#69717d]">Analiza la foto para crear un punto de partida editable. La estimación es visual, no físicamente exacta.</p>}
      <button type="button" disabled={lighting.analyzing} onClick={() => void lighting.analyzeLighting()} className="mt-3 h-9 w-full rounded-md bg-[#1f2421] text-xs font-semibold text-white disabled:opacity-45">{lighting.analyzing ? "Analizando…" : "Analizar iluminación"}</button>
      {profile ? <>
        <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => lighting.setGuideVisible(!lighting.guideVisible)} className="h-9 rounded-md border bg-white text-xs font-semibold">{lighting.guideVisible ? "Ocultar guía" : "Editar manualmente"}</button><button type="button" onClick={lighting.duplicateProfile} className="h-9 rounded-md border bg-white text-xs font-semibold">Duplicar perfil</button></div>
        <details className="mt-3 rounded-md border bg-white p-2">
          <summary className="cursor-pointer text-xs font-semibold">Ajustes del perfil</summary>
          <div className="mt-3 space-y-3">
            <LightingSlider label="Dirección horizontal" value={profile.direction.x * 100} onChange={(x) => lighting.updateProfile(profile.id, { direction: { x: x / 100, y: profile.direction.y } })} onReset={() => lighting.updateProfile(profile.id, { direction: { x: 0, y: profile.direction.y } })} />
            <LightingSlider label="Dirección vertical" value={profile.direction.y * 100} onChange={(y) => lighting.updateProfile(profile.id, { direction: { x: profile.direction.x, y: y / 100 } })} onReset={() => lighting.updateProfile(profile.id, { direction: { x: profile.direction.x, y: 1 } })} />
            {controls.map(([label, key, minimum, maximum]) => <LightingSlider key={key} label={label} value={profile[key]} minimum={minimum} maximum={maximum} onChange={(value) => lighting.updateProfile(profile.id, { [key]: value })} onReset={() => lighting.updateProfile(profile.id, { [key]: 0 })} />)}
          </div>
          <label className="mt-3 block text-xs font-semibold">Tipo de fuente<select value={profile.sourceType} onChange={(event) => lighting.updateProfile(profile.id, { sourceType: event.target.value as RoomLightProfile["sourceType"] })} className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs"><option value="unknown">Desconocida</option><option value="window">Ventana</option><option value="ceiling-light">Luz de techo</option><option value="lamp">Lámpara</option><option value="mixed">Mixta</option></select></label>
        </details>
        <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => void lighting.applyToAllObjects()} className="h-9 rounded-md border bg-white text-xs font-semibold">Aplicar a todos</button><button type="button" onClick={lighting.resetActiveProfile} className="h-9 rounded-md border bg-white text-xs font-semibold">Restablecer</button></div>
      </> : null}
    </section>
  );
}
