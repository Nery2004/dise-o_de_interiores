"use client";

import { Check, Move, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { useMaskEditor } from "@/components/use-mask-editor";
import { cn } from "@/lib/utils";

export function MaskEditingPanel() {
  const editor = useEditor();
  const { addPoint, selectedMask } = useMaskEditor();

  if (!selectedMask) {
    return <div className="rounded-md border border-dashed border-[#d5dbe3] bg-white px-3 py-5 text-center text-sm text-[#7b8490]">Selecciona una mascara para editarla.</div>;
  }

  if (!selectedMask.points) {
    return <div className="rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-3 text-sm leading-5 text-[#8a5a1f]">Esta mascara debe convertirse a puntos antes de editarse.</div>;
  }

  const selectedPoint = editor.selectedPointIndexes.length === 1
    ? selectedMask.points[editor.selectedPointIndexes[0]]
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#dfe3e8] bg-white p-3">
        <p className="truncate text-sm font-semibold text-[#202124]">{selectedMask.name}</p>
        <p className="mt-1 text-xs text-[#69717d]">{selectedMask.points.length} puntos</p>
      </div>

      <div className="rounded-md border border-[#dfe3e8] bg-white p-3 text-xs text-[#4b5563]">
        {editor.selectedPointIndexes.length > 1 ? (
          <p>{editor.selectedPointIndexes.length} puntos seleccionados</p>
        ) : selectedPoint ? (
          <dl className="grid grid-cols-2 gap-2">
            <div><dt className="text-[#8a929e]">X</dt><dd className="font-mono font-semibold">{selectedPoint.x.toFixed(1)}</dd></div>
            <div><dt className="text-[#8a929e]">Y</dt><dd className="font-mono font-semibold">{selectedPoint.y.toFixed(1)}</dd></div>
          </dl>
        ) : <p>Selecciona uno o varios puntos.</p>}
      </div>

      <div className="grid gap-2">
        <button type="button" onClick={addPoint} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white text-sm font-semibold text-[#30343b] hover:bg-[#f8fafc]"><Plus size={15} />Agregar punto</button>
        <button type="button" disabled={editor.selectedPointIndexes.length === 0} onClick={editor.deleteSelectedPoints} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#f0c7c2] bg-white text-sm font-semibold text-[#b42318] hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-45"><Trash2 size={15} />Eliminar punto</button>
        <button type="button" onClick={() => editor.setMoveWholeMask(!editor.moveWholeMask)} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold", editor.moveWholeMask ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#dfe3e8] bg-white text-[#30343b] hover:bg-[#f8fafc]")}><Move size={15} />Mover mascara completa</button>
      </div>

      <div className="border-t border-[#edf0f3] pt-4 space-y-2">
        <button type="button" onClick={editor.saveMaskEditing} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] text-sm font-semibold text-white hover:bg-[#343b36]"><Check size={15} />Guardar cambios</button>
        <button type="button" onClick={editor.cancelMaskEditing} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white text-sm font-semibold text-[#30343b] hover:bg-[#f8fafc]"><X size={15} />Cancelar edicion</button>
        <button type="button" onClick={editor.resetMaskShape} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white text-sm font-semibold text-[#30343b] hover:bg-[#f8fafc]"><RotateCcw size={15} />Restablecer forma</button>
      </div>
    </div>
  );
}
