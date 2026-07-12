"use client";

import { useDecorPlacement } from "@/components/decor-placement-context";
import type {
  ObjectAnchor,
  PerspectiveMode,
  PlacementSurfaceType,
  ZOrderMode,
} from "@/types/perspective";
import { useRoomLighting } from "@/components/room-lighting-context";

export function ObjectPerspectiveProperties() {
  const placement = useDecorPlacement();
  const lighting = useRoomLighting();
  const object = placement.placedObjects.find(
    (item) => item.id === placement.selectedObjectId,
  );
  if (!object) return null;
  const changeMode = (mode: PerspectiveMode) => {
    if (mode === "free-transform") placement.setFreeTransform(object.id);
    else if (mode === "none") placement.resetObjectPerspective(object.id);
    else placement.fitObjectPerspective(object.id);
  };
  return (
    <section className="mt-4 border-t border-[#e1e5ea] pt-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69717d]">
        Profundidad y perspectiva
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[11px] font-semibold text-[#69717d]">
          Superficie
          <select
            value={object.surfaceId ?? ""}
            disabled={object.locked}
            onChange={(event) => {
              const surface = placement.placementSurfaces.find(
                (item) => item.id === event.target.value,
              );
              placement.updatePlacedObject(object.id, {
                surfaceId: surface?.id,
                surfaceType: surface?.type ?? "free",
              });
              if (object.lightingMode === "auto" && !object.lightingLocked)
                void lighting.adaptObject({ ...object, surfaceId: surface?.id, surfaceType: surface?.type ?? "free" });
            }}
            className="mt-1 h-9 w-full rounded border bg-white px-2 text-xs"
          >
            <option value="">Sin anclar</option>
            {placement.placementSurfaces.map((surface) => (
              <option key={surface.id} value={surface.id}>
                {surface.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[#69717d]">
          Tipo
          <select
            value={object.surfaceType}
            disabled={object.locked}
            onChange={(event) =>
              placement.updatePlacedObject(object.id, {
                surfaceType: event.target.value as PlacementSurfaceType,
              })
            }
            className="mt-1 h-9 w-full rounded border bg-white px-2 text-xs"
          >
            <option value="floor">Piso</option>
            <option value="wall">Pared</option>
            <option value="table">Mesa</option>
            <option value="ceiling">Techo</option>
            <option value="free">Libre</option>
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[#69717d]">
          Ancla
          <select
            value={object.anchor}
            disabled={object.locked}
            onChange={(event) =>
              placement.updatePlacedObject(object.id, {
                anchor: event.target.value as ObjectAnchor,
              })
            }
            className="mt-1 h-9 w-full rounded border bg-white px-2 text-xs"
          >
            <option value="center">Centro</option>
            <option value="bottom-center">Base</option>
            <option value="top-center">Superior</option>
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[#69717d]">
          Modo
          <select
            value={object.perspectiveMode}
            disabled={object.locked}
            onChange={(event) =>
              changeMode(event.target.value as PerspectiveMode)
            }
            className="mt-1 h-9 w-full rounded border bg-white px-2 text-xs"
          >
            <option value="none">Sin perspectiva</option>
            <option value="surface">Superficie</option>
            <option value="free-transform">4 esquinas</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-[11px] font-semibold text-[#69717d]">
        Profundidad: {Math.round(object.depth * 100)}%
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(object.depth * 100)}
          disabled={object.locked}
          onPointerDown={placement.beginHistoryTransaction}
          onChange={(event) =>
            placement.updatePlacedObject(
              object.id,
              { depth: Number(event.target.value) / 100 },
              false,
            )
          }
          onPointerUp={(event) => {
            placement.commitHistoryTransaction();
            if (object.lightingMode === "auto" && !object.lightingLocked)
              void lighting.adaptObject({ ...object, depth: Number(event.currentTarget.value) / 100 });
          }}
          className="mt-1 w-full accent-[#7c3aed]"
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold">
          <input
            type="checkbox"
            checked={object.autoScaleByDepth}
            disabled={object.locked}
            onChange={(event) =>
              placement.updatePlacedObject(object.id, {
                autoScaleByDepth: event.target.checked,
              })
            }
          />
          Autoescala
        </label>
        <label className="text-[11px] font-semibold text-[#69717d]">
          Orden
          <select
            value={object.zOrderMode}
            onChange={(event) =>
              placement.updatePlacedObject(object.id, {
                zOrderMode: event.target.value as ZOrderMode,
              })
            }
            className="ml-2 rounded border bg-white px-1 py-1"
          >
            <option value="manual">Manual</option>
            <option value="depth">Profundidad</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-[11px] font-semibold text-[#69717d]">
        Contacto de base
        <input
          type="number"
          value={object.baseContactOffset}
          min={-500}
          max={500}
          disabled={object.locked}
          onChange={(event) =>
            placement.updatePlacedObject(object.id, {
              baseContactOffset: Number(event.target.value) || 0,
            })
          }
          className="mt-1 h-8 w-full rounded border px-2 text-xs"
        />
      </label>
      <div className="mt-3 grid grid-cols-3 gap-1">
        <button
          type="button"
          disabled={!object.surfaceId || object.locked}
          onClick={() => placement.fitObjectPerspective(object.id)}
          className="rounded border bg-white py-2 text-[10px] font-semibold disabled:opacity-40"
        >
          Ajustar
        </button>
        <button
          type="button"
          disabled={object.locked}
          onClick={() => placement.setFreeTransform(object.id)}
          className="rounded border bg-white py-2 text-[10px] font-semibold disabled:opacity-40"
        >
          4 esquinas
        </button>
        <button
          type="button"
          onClick={() => placement.unanchorObject(object.id)}
          className="rounded border bg-white py-2 text-[10px] font-semibold"
        >
          Desanclar
        </button>
      </div>
      {object.perspectivePoints ? (
        <div className="mt-3 grid grid-cols-2 gap-1">
          {(["topLeft", "topRight", "bottomRight", "bottomLeft"] as const).map(
            (key, index) => (
              <div key={key} className="grid grid-cols-2 gap-1">
                <label className="text-[9px]">
                  P{index + 1} X
                  <input
                    type="number"
                    value={Math.round(object.perspectivePoints![key].x)}
                    onChange={(event) =>
                      placement.updatePlacedObject(object.id, {
                        perspectivePoints: {
                          ...object.perspectivePoints!,
                          [key]: {
                            ...object.perspectivePoints![key],
                            x: Number(event.target.value),
                          },
                        },
                      })
                    }
                    className="h-7 w-full rounded border px-1 text-[10px]"
                  />
                </label>
                <label className="text-[9px]">
                  Y
                  <input
                    type="number"
                    value={Math.round(object.perspectivePoints![key].y)}
                    onChange={(event) =>
                      placement.updatePlacedObject(object.id, {
                        perspectivePoints: {
                          ...object.perspectivePoints!,
                          [key]: {
                            ...object.perspectivePoints![key],
                            y: Number(event.target.value),
                          },
                        },
                      })
                    }
                    className="h-7 w-full rounded border px-1 text-[10px]"
                  />
                </label>
              </div>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}
