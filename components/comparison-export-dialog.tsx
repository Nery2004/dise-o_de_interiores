"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useComparison } from "@/components/comparison-context";
import { useEditor } from "@/components/editor-context";
import { useProject } from "@/components/project-context";
import { downloadBlob } from "@/lib/exportImage";
import {
  renderProposalGrid,
  renderSideBySideComparison,
} from "@/lib/comparison/comparisonRenderer";
import { normalizeExportFilename } from "@/lib/proposals/proposalUtils";
export function ComparisonExportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const editor = useEditor();
  const project = useProject();
  const comparison = useComparison();
  const [format, setFormat] = useState<"side" | "split" | "grid">("side");
  if (!open) return null;
  async function run() {
    if (!editor.image) return;
    try {
      const blob =
        format === "grid"
          ? await renderProposalGrid({
              proposals: project.proposals.filter((proposal) =>
                project.selectedProposalIds.includes(proposal.id),
              ),
              includeInfo: comparison.includeExportInfo,
              title: project.activeProjectName ?? undefined,
            })
          : await renderSideBySideComparison({
              image: editor.image,
              masks: editor.masks,
              blendMode: editor.globalBlendMode,
              split: format === "split",
              includeInfo: comparison.includeExportInfo,
              title: project.activeProjectName ?? undefined,
            });
      downloadBlob(
        blob,
        `${normalizeExportFilename(project.activeProjectName ?? "proyecto")}-comparacion.png`,
      );
      onClose();
    } catch {
      toast.error("No se pudo generar la comparación.");
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold">Exportar comparación</h2>
        <label className="mt-5 block text-sm font-medium">
          Formato
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as typeof format)}
            className="mt-2 h-11 w-full rounded-md border px-3"
          >
            <option value="side">Antes y después lado a lado</option>
            <option value="split">División al 50 %</option>
            <option value="grid">Cuadrícula de propuestas</option>
          </select>
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={comparison.includeExportInfo}
            onChange={(event) =>
              comparison.setIncludeExportInfo(event.target.checked)
            }
          />
          Incluir información
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 rounded-md border px-4 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => void run()}
            className="h-10 rounded-md bg-[#1f2421] px-4 text-sm font-semibold text-white"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
