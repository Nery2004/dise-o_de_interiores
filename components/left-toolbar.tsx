"use client";

import {
  Brush,
  Armchair,
  CircleMinus,
  CirclePlus,
  Eraser,
  Hand,
  MousePointer2,
  PenTool,
  Scan,
  ScanSearch,
  SplitSquareHorizontal,
} from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { editorTools } from "@/lib/editor-data";
import { cn } from "@/lib/utils";
import type { EditorTool } from "@/types/editor";
import { useComparison } from "@/components/comparison-context";

const toolIcons: Record<EditorTool, React.ComponentType<{ size?: number }>> = {
  select: MousePointer2,
  objects: Armchair,
  "manual-select": PenTool,
  "edit-mask": Scan,
  "add-to-mask": CirclePlus,
  "remove-from-mask": CircleMinus,
  "paint-wall": Brush,
  eraser: Eraser,
  zoom: ScanSearch,
  pan: Hand,
  compare: SplitSquareHorizontal,
};

export function LeftToolbar() {
  const comparison = useComparison();
  const {
    activeColor,
    activeTool,
    beforeAfterEnabled,
    image,
    selectedMaskId,
    setActiveTool,
    toggleBeforeAfter,
  } = useEditor();
  const needsSelectedMask = activeTool === "paint-wall" && !selectedMaskId;
  const needsActiveColor =
    activeTool === "paint-wall" && Boolean(selectedMaskId) && !activeColor;
  const needsImageForManualSelection = activeTool === "manual-select" && !image;
  const needsMaskForEditing = activeTool === "edit-mask" && !selectedMaskId;
  const isBrushTool =
    activeTool === "add-to-mask" || activeTool === "remove-from-mask";
  const needsMaskForBrush = isBrushTool && !selectedMaskId;

  return (
    <aside className="rounded-lg border border-[#dde1e7] bg-white p-3 shadow-sm">
      <div className="mb-3 border-b border-[#edf0f3] pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          Herramientas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {editorTools.map((tool) => {
          const Icon = toolIcons[tool.id];
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setActiveTool(tool.id);

                if (tool.id === "compare") {
                  if (beforeAfterEnabled) toggleBeforeAfter();
                  comparison.setMode("slider");
                }
              }}
              className={cn(
                "flex h-12 items-center justify-between rounded-md border px-3 text-left text-sm font-medium transition",
                isActive
                  ? "border-[#1f2421] bg-[#1f2421] text-white shadow-sm"
                  : "border-transparent bg-[#f7f8fa] text-[#3b414a] hover:border-[#d7dce3] hover:bg-white",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon size={17} />
                <span className="truncate">{tool.label}</span>
              </span>
              <span
                className={cn(
                  "hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold sm:inline",
                  isActive
                    ? "border-white/30 text-white/80"
                    : "border-[#d8dde4] text-[#8a929e]",
                )}
              >
                {tool.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {needsSelectedMask ? (
        <div className="mt-3 rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          Selecciona una pared para preparar la aplicacion de color.
        </div>
      ) : null}

      {needsActiveColor ? (
        <div className="mt-3 rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          Elige un color primero.
        </div>
      ) : null}

      {needsImageForManualSelection ? (
        <div className="mt-3 rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          Primero sube una imagen para seleccionar una pared.
        </div>
      ) : null}

      {needsMaskForEditing ? (
        <div className="mt-3 rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          Selecciona una mascara para editar sus puntos.
        </div>
      ) : null}

      {needsMaskForBrush ? (
        <div className="mt-3 rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          Selecciona una pared antes de refinarla.
        </div>
      ) : null}

      {beforeAfterEnabled ? (
        <div className="mt-3 rounded-md border border-[#cdd9ff] bg-[#eef3ff] px-3 py-2 text-xs leading-5 text-[#3f568c]">
          Antes / Despues activo: los colores aplicados estan ocultos.
        </div>
      ) : null}
    </aside>
  );
}
