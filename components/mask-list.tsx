"use client";

import { Eye, EyeOff, MousePointer2, Trash2 } from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { cn } from "@/lib/utils";

export function MaskList() {
  const { deleteMask, masks, selectMask, selectedMaskId, toggleMaskVisibility } =
    useEditor();

  if (masks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#d5dbe3] bg-[#fafbfc] px-3 py-5 text-center text-sm text-[#7b8490]">
        Aun no hay paredes detectadas.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {masks.map((mask) => {
        const isSelected = selectedMaskId === mask.id;

        return (
          <div
            key={mask.id}
            className={cn(
              "rounded-md border p-3 transition",
              isSelected
                ? "border-[#2563eb] bg-[#eff6ff]"
                : "border-[#edf0f3] bg-[#fafbfc]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#202124]">
                  {mask.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7a8290]">
                  {mask.type}
                  {typeof mask.confidence === "number"
                    ? ` · ${Math.round(mask.confidence * 100)}%`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Seleccionar mascara"
                  onClick={() => selectMask(mask.id)}
                  className="grid h-8 w-8 place-items-center rounded text-[#4b5563] transition hover:bg-white"
                >
                  <MousePointer2 size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Mostrar u ocultar mascara"
                  onClick={() => toggleMaskVisibility(mask.id)}
                  className="grid h-8 w-8 place-items-center rounded text-[#4b5563] transition hover:bg-white"
                >
                  {mask.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  aria-label="Eliminar mascara"
                  onClick={() => deleteMask(mask.id)}
                  className="grid h-8 w-8 place-items-center rounded text-[#b42318] transition hover:bg-white"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
