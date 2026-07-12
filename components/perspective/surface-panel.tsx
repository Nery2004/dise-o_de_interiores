"use client";

import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Plus,
  ScanSearch,
  Trash2,
  X,
} from "lucide-react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import type { PlacementSurfaceType } from "@/types/perspective";

const labels: Record<PlacementSurfaceType, string> = {
  floor: "Piso",
  wall: "Pared",
  table: "Mesa",
  ceiling: "Techo",
  free: "Libre",
};

export function SurfacePanel() {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const selected = placement.placementSurfaces.find(
    (surface) => surface.id === placement.selectedSurfaceId,
  );
  const guide = placement.perspectiveGuide;
  return (
    <section className="mt-4 border-t border-[#e1e5ea] pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69717d]">
            Superficies y perspectiva
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[#7a8290]">
            Guías manuales; la detección es heurística.
          </p>
        </div>
        <button
          type="button"
          onClick={placement.detectPlacementSurfaces}
          disabled={!editor.dimensions}
          className="grid h-9 w-9 place-items-center rounded-md border bg-white disabled:opacity-40"
          title="Detectar superficies"
        >
          <ScanSearch size={15} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <select
          value={placement.surfaceDraftType}
          onChange={(event) =>
            placement.beginSurfaceDraft(
              event.target.value as PlacementSurfaceType,
            )
          }
          className="h-9 rounded-md border bg-white px-2 text-xs"
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            placement.beginSurfaceDraft(placement.surfaceDraftType)
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#202621] px-3 text-xs font-semibold text-white"
        >
          <Plus size={14} />
          Nueva
        </button>
      </div>
      {editor.activeTool === "define-surface" ? (
        <div className="mt-3 rounded-lg border border-[#bcd1ca] bg-[#edf7f3] p-3 text-[11px] leading-4 text-[#315f55]">
          Haz clic para añadir al menos 3 puntos. Doble clic o Enter termina;
          Escape cancela.
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => placement.finishSurfaceDraft()}
              className="rounded border bg-white px-2 py-1 font-semibold"
            >
              Terminar
            </button>
            <button
              type="button"
              onClick={placement.cancelSurfaceDraft}
              className="inline-flex items-center gap-1 rounded border bg-white px-2 py-1"
            >
              <X size={12} />
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-3 space-y-1.5">
        {placement.placementSurfaces.map((surface) => (
          <button
            type="button"
            key={surface.id}
            onClick={() => placement.selectPlacementSurface(surface.id)}
            className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-xs ${surface.selected ? "border-[#596d5b] bg-[#eef3eb]" : "bg-white"}`}
          >
            <span className="min-w-0 flex-1 truncate">{surface.name}</span>
            <span className="text-[10px] text-[#7a8290]">
              {labels[surface.type]}
            </span>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="mt-3 rounded-lg border bg-white p-3">
          <label className="block text-[11px] font-semibold text-[#69717d]">
            Nombre
            <input
              value={selected.name}
              disabled={selected.locked}
              onChange={(event) =>
                placement.updatePlacementSurface(
                  selected.id,
                  { name: event.target.value.slice(0, 80) },
                  false,
                )
              }
              onBlur={placement.commitHistoryTransaction}
              onFocus={placement.beginHistoryTransaction}
              className="mt-1 h-8 w-full rounded border px-2 text-xs"
            />
          </label>
          <label className="mt-2 block text-[11px] font-semibold text-[#69717d]">
            Tipo
            <select
              value={selected.type}
              disabled={selected.locked}
              onChange={(event) =>
                placement.updatePlacementSurface(selected.id, {
                  type: event.target.value as PlacementSurfaceType,
                })
              }
              className="mt-1 h-8 w-full rounded border px-2 text-xs"
            >
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
            <input
              type="checkbox"
              checked={selected.snapEnabled}
              onChange={(event) =>
                placement.updatePlacementSurface(selected.id, {
                  snapEnabled: event.target.checked,
                })
              }
            />
            Ajuste magnético
          </label>
          <div className="mt-2 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() =>
                placement.updatePlacementSurface(selected.id, {
                  visible: !selected.visible,
                })
              }
              className="grid h-8 place-items-center rounded border"
            >
              {selected.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              onClick={() =>
                placement.updatePlacementSurface(selected.id, {
                  locked: !selected.locked,
                })
              }
              className="grid h-8 place-items-center rounded border"
            >
              {selected.locked ? <Lock size={14} /> : <LockOpen size={14} />}
            </button>
            <button
              type="button"
              onClick={() => placement.deletePlacementSurface(selected.id)}
              className="grid h-8 place-items-center rounded border text-[#b42318]"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button
              type="button"
              disabled={selected.locked}
              onClick={() => placement.addSurfacePoint(selected.id)}
              className="rounded border py-1.5 text-[10px] font-semibold disabled:opacity-40"
            >
              Añadir punto
            </button>
            <button
              type="button"
              disabled={selected.locked || selected.points.length <= 3}
              onClick={() => placement.removeSurfacePoint(selected.id)}
              className="rounded border py-1.5 text-[10px] font-semibold disabled:opacity-40"
            >
              Quitar punto
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#7a8290]">
            Arrastra un vértice para editarlo o el borde para mover toda la
            superficie.
          </p>
        </div>
      ) : null}
      <div className="mt-4 rounded-lg border bg-[#fafbfc] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Guía de horizonte</p>
          <button
            type="button"
            onClick={() => editor.setActiveTool("horizon")}
            className="rounded border bg-white px-2 py-1 text-[11px] font-semibold"
          >
            Definir
          </button>
        </div>
        {guide ? (
          <>
            <label className="mt-2 block text-[11px] font-semibold text-[#69717d]">
              Altura: {Math.round(guide.horizonY)} px
              <input
                type="range"
                min="0"
                max={editor.dimensions?.height ?? 100}
                value={guide.horizonY}
                onPointerDown={placement.beginHistoryTransaction}
                onChange={(event) =>
                  placement.setPerspectiveGuide(
                    { ...guide, horizonY: Number(event.target.value) },
                    false,
                  )
                }
                onPointerUp={placement.commitHistoryTransaction}
                className="mt-1 w-full accent-[#e11d48]"
              />
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  placement.setPerspectiveGuide({
                    ...guide,
                    visible: !guide.visible,
                  })
                }
                className="flex-1 rounded border bg-white py-1 text-[11px]"
              >
                {guide.visible ? "Ocultar" : "Mostrar"}
              </button>
              <button
                type="button"
                onClick={() => placement.setPerspectiveGuide(null)}
                className="flex-1 rounded border bg-white py-1 text-[11px] text-[#b42318]"
              >
                Restablecer
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-[#7a8290]">
            Haz clic en el lienzo para fijar horizonte y puntos de fuga.
          </p>
        )}
      </div>
    </section>
  );
}
