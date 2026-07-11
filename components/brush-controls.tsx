"use client";

import { CircleMinus, CirclePlus, Eye, EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { cn } from "@/lib/utils";

export function BrushControls() {
  const editor = useEditor();
  const selectedMask = editor.masks.find((mask) => mask.id === editor.selectedMaskId);
  const isAddMode = editor.activeTool === "add-to-mask";
  const strokeCount = selectedMask?.refinement
    ? selectedMask.refinement.addStrokes.length + selectedMask.refinement.removeStrokes.length
    : 0;

  if (!selectedMask) {
    return <div className="rounded-md border border-dashed border-[#d5dbe3] bg-white px-3 py-5 text-center text-sm text-[#7b8490]">Selecciona una pared antes de refinarla.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => editor.setActiveTool("add-to-mask")} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-semibold", isAddMode ? "border-[#15803d] bg-[#f0fdf4] text-[#166534]" : "border-[#dfe3e8] bg-white text-[#4b5563]")}><CirclePlus size={15} />Añadir</button>
        <button type="button" onClick={() => editor.setActiveTool("remove-from-mask")} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-semibold", !isAddMode ? "border-[#dc2626] bg-[#fef2f2] text-[#991b1b]" : "border-[#dfe3e8] bg-white text-[#4b5563]")}><CircleMinus size={15} />Quitar</button>
      </div>

      <label className="block">
        <span className="flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#7a8290]"><span>Tamaño del pincel</span><span>{editor.brushSize}px</span></span>
        <input type="range" min="4" max="240" step="1" value={editor.brushSize} onChange={(event) => editor.setBrushSize(Number(event.target.value))} className="mt-3 w-full accent-[#1f2421]" />
      </label>
      <label className="block">
        <span className="flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#7a8290]"><span>Dureza</span><span>{Math.round(editor.brushHardness * 100)}%</span></span>
        <input type="range" min="0" max="1" step="0.01" value={editor.brushHardness} onChange={(event) => editor.setBrushHardness(Number(event.target.value))} className="mt-3 w-full accent-[#1f2421]" />
      </label>
      <label className="block">
        <span className="flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#7a8290]"><span>Opacidad del trazo</span><span>{Math.round(editor.brushOpacity * 100)}%</span></span>
        <input type="range" min="0.05" max="1" step="0.01" value={editor.brushOpacity} onChange={(event) => editor.setBrushOpacity(Number(event.target.value))} className="mt-3 w-full accent-[#1f2421]" />
      </label>

      <p className="text-xs text-[#69717d]">{strokeCount} {strokeCount === 1 ? "trazo confirmado" : "trazos confirmados"}</p>

      <div className="grid gap-2 border-t border-[#edf0f3] pt-4">
        <button type="button" disabled={strokeCount === 0} onClick={() => editor.undoLastBrushStroke(selectedMask.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white text-sm font-semibold text-[#30343b] disabled:cursor-not-allowed disabled:opacity-45"><RotateCcw size={15} />Deshacer ultimo trazo</button>
        <button type="button" disabled={strokeCount === 0} onClick={() => editor.clearMaskRefinements(selectedMask.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#f0c7c2] bg-white text-sm font-semibold text-[#b42318] disabled:cursor-not-allowed disabled:opacity-45"><Trash2 size={15} />Limpiar refinamientos</button>
        <button type="button" onClick={() => editor.setMaskOnlyPreview(!editor.maskOnlyPreview)} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold", editor.maskOnlyPreview ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#dfe3e8] bg-white text-[#30343b]")}>{editor.maskOnlyPreview ? <EyeOff size={15} /> : <Eye size={15} />}Mostrar solo máscara</button>
        <button type="button" onClick={() => editor.setInvertRefinementPreview(!editor.invertRefinementPreview)} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold", editor.invertRefinementPreview ? "border-[#7c3aed] bg-[#f5f3ff] text-[#6d28d9]" : "border-[#dfe3e8] bg-white text-[#30343b]")}><RotateCcw size={15} />Invertir vista</button>
      </div>
    </div>
  );
}
