"use client";

import { CornerDownLeft, MousePointerClick, OctagonX } from "lucide-react";
import { useEditor } from "@/components/editor-context";

export function DrawingHelpOverlay() {
  const { activeTool, image, manualPoints } = useEditor();

  if (activeTool !== "manual-select" || !image) {
    return null;
  }

  return (
    <div className="absolute left-4 top-16 z-10 max-w-72 rounded-lg border border-[#dfe3e8] bg-white/95 p-3 text-xs text-[#4b5563] shadow-sm backdrop-blur">
      <p className="mb-3 font-semibold text-[#202124]">Seleccion manual</p>
      <div className="space-y-2">
        <p className="flex items-center gap-2">
          <MousePointerClick size={14} />
          Click para agregar puntos
        </p>
        <p className="flex items-center gap-2">
          <CornerDownLeft size={14} />
          Enter para finalizar
        </p>
        <p className="flex items-center gap-2">
          <OctagonX size={14} />
          Esc para cancelar
        </p>
        <p>Click cerca del primer punto para cerrar</p>
      </div>
      <p className="mt-3 rounded-md bg-[#f3f4f6] px-2 py-1 font-mono text-[11px]">
        Puntos: {manualPoints.length}
      </p>
    </div>
  );
}
