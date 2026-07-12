"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function DevCapabilities() {
  const indexedDb = useSyncExternalStore(subscribe, () => typeof indexedDB !== "undefined", () => false);
  const canvas = useSyncExternalStore(subscribe, () => { const element = document.createElement("canvas"); return Boolean(element.getContext("2d")); }, () => false);
  const runtimeRaw = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem("interior-color-studio:dev-diagnostics"),
    () => null,
  );
  let runtime: Record<string, unknown> | null = null;
  try {
    runtime = runtimeRaw ? JSON.parse(runtimeRaw) as Record<string, unknown> : null;
  } catch {}
  const number = (key: string, suffix = "") =>
    typeof runtime?.[key] === "number"
      ? `${(runtime[key] as number).toFixed(key.endsWith("Ms") ? 1 : 0)}${suffix}`
      : "Sin muestra";
  return <dl className="grid gap-3 sm:grid-cols-2"><Status label="IndexedDB disponible" value={indexedDb} /><Status label="Canvas disponible" value={canvas} />{runtime ? <><Item label="Máscaras (última sesión)" value={number("masks")} /><Item label="Objetos (última sesión)" value={number("objects")} /><Item label="Interacción" value={String(runtime.interaction ?? "Sin muestra")} /><Item label="Escala del canvas" value={number("scale")} /><Item label="Caché aproximada" value={number("cacheBytes", " bytes")} /><Item label="Worker de iluminación" value={runtime.workerActive ? "Activo" : "Inactivo"} /><Item label="Último render" value={number("lastRenderMs", " ms")} /><Item label="Última exportación" value={number("lastExportMs", " ms")} /></> : <div className="rounded-lg border border-[#dfe3e8] bg-white p-4 sm:col-span-2"><p className="text-sm text-[#69717d]">Abre el editor en esta pestaña para registrar métricas de la sesión.</p></div>}</dl>;
}

function Status({ label, value }: { label: string; value: boolean }) { return <div className="rounded-lg border border-[#dfe3e8] bg-white p-4"><dt className="text-sm text-[#69717d]">{label}</dt><dd className="mt-1 font-semibold">{value ? "Sí" : "No"}</dd></div>; }
function Item({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[#dfe3e8] bg-white p-4"><dt className="text-sm text-[#69717d]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
