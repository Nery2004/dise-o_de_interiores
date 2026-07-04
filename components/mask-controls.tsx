"use client";

import { useEditor } from "@/components/editor-context";
import { maskColorSwatches } from "@/lib/editor-data";
import { cn } from "@/lib/utils";

export function MaskControls() {
  const {
    activeColor,
    activeTool,
    masks,
    selectedMaskId,
    setActiveColor,
    updateMask,
  } = useEditor();
  const selectedMask = masks.find((mask) => mask.id === selectedMaskId);

  if (!selectedMask) {
    return (
      <div className="rounded-md border border-dashed border-[#d5dbe3] bg-white px-3 py-5 text-center text-sm text-[#7b8490]">
        Selecciona una pared para editar sus propiedades.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Nombre
        </span>
        <input
          value={selectedMask.name}
          onChange={(event) =>
            updateMask(selectedMask.id, { name: event.target.value })
          }
          className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
        />
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Opacity
          <span>{Math.round(selectedMask.opacity * 100)}%</span>
        </span>
        <input
          type="range"
          min="0.05"
          max="0.85"
          step="0.01"
          value={selectedMask.opacity}
          onChange={(event) =>
            updateMask(selectedMask.id, {
              opacity: Number(event.target.value),
            })
          }
          className="mt-3 w-full accent-[#1f2421]"
        />
      </label>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Color aplicado
        </p>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {maskColorSwatches.map((color) => {
            const isActive = activeColor === color || selectedMask.color === color;

            return (
              <button
                key={color}
                type="button"
                aria-label={`Aplicar color ${color}`}
                onClick={() => {
                  setActiveColor(color);
                  updateMask(selectedMask.id, { color });
                }}
                className={cn(
                  "h-8 rounded-md border transition",
                  isActive
                    ? "border-[#202124] ring-2 ring-[#202124]/10"
                    : "border-black/10",
                  activeTool === "paint-wall" && "shadow-sm",
                )}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
        <p className="mt-3 font-mono text-xs text-[#69717d]">
          {selectedMask.color ?? "Sin color aplicado"}
        </p>
      </div>
    </div>
  );
}
