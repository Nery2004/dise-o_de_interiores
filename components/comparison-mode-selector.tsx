"use client";

import { Download, Images, MonitorPlay } from "lucide-react";
import { useState } from "react";
import { useComparison } from "@/components/comparison-context";
import { ComparisonExportDialog } from "@/components/comparison-export-dialog";
import { FullscreenButton } from "@/components/fullscreen-button";
import { useEditor } from "@/components/editor-context";
import type { ComparisonMode } from "@/types/proposal";

const modes: Array<{ value: ComparisonMode; label: string }> = [
  { value: "original", label: "Vista original" },
  { value: "edited", label: "Vista editada" },
  { value: "slider", label: "Antes / Después" },
  { value: "side-by-side", label: "Lado a lado" },
  { value: "proposals", label: "Comparar propuestas" },
  { value: "split-vertical", label: "División vertical" },
  { value: "split-horizontal", label: "División horizontal" },
];

export function ComparisonModeSelector() {
  const comparison = useComparison();
  const editor = useEditor();
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <>
      <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#dfe3e8] bg-white/95 p-1.5 shadow-lg backdrop-blur">
        <Images size={16} className="ml-1 text-[#69717d]" />
        <select
          value={comparison.mode}
          onChange={(event) => {
            if (editor.beforeAfterEnabled) editor.toggleBeforeAfter();
            comparison.setMode(event.target.value as ComparisonMode);
          }}
          aria-label="Modo de comparación"
          className="h-9 rounded-md border-0 bg-transparent px-2 text-sm font-semibold outline-none"
        >
          {modes.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
        {comparison.mode === "side-by-side" ? (
          <label className="flex items-center gap-1.5 border-l pl-2 text-xs">
            <input
              type="checkbox"
              checked={comparison.syncViews}
              onChange={(event) =>
                comparison.setSyncViews(event.target.checked)
              }
            />
            Sincronizar vistas
          </label>
        ) : null}
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          title="Exportar comparación"
          className="grid h-9 w-9 place-items-center rounded hover:bg-[#eef1f4]"
        >
          <Download size={16} />
        </button>
        <button
          type="button"
          onClick={() => comparison.setPresentationMode(true)}
          title="Presentación"
          className="grid h-9 w-9 place-items-center rounded hover:bg-[#eef1f4]"
        >
          <MonitorPlay size={16} />
        </button>
        <FullscreenButton className="grid h-9 w-9 place-items-center rounded hover:bg-[#eef1f4]" />
      </div>
      <ComparisonExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </>
  );
}
