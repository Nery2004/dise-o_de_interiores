"use client";

import Image from "next/image";
import {
  Copy,
  Download,
  Eye,
  Heart,
  Maximize2,
  Pencil,
  Plus,
  Presentation,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useComparison } from "@/components/comparison-context";
import { useEditor } from "@/components/editor-context";
import { useProject } from "@/components/project-context";
import { SaveProposalDialog } from "@/components/save-proposal-dialog";
import { FullscreenButton } from "@/components/fullscreen-button";
import { downloadBlob, exportEditedImage } from "@/lib/exportImage";
import {
  countColoredWalls,
  getDominantColor,
  getMostUsedBlendMode,
  getProposalColors,
} from "@/lib/proposals/proposalStatistics";
import { normalizeExportFilename } from "@/lib/proposals/proposalUtils";
import type { DesignProposal } from "@/types/proposal";

export function ProposalPanel() {
  const project = useProject();
  const editor = useEditor();
  const comparison = useComparison();
  const [saveOpen, setSaveOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites" | "recent">("all");
  const [applyTarget, setApplyTarget] = useState<DesignProposal | null>(null);
  const [detail, setDetail] = useState<DesignProposal | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [detailPosition, setDetailPosition] = useState(100);
  const proposals = [...project.proposals]
    .filter((proposal) => filter !== "favorites" || proposal.isFavorite)
    .filter((proposal) => !tagFilter || proposal.tags?.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase())))
    .sort((a, b) =>
      filter === "recent" ? b.updatedAt.localeCompare(a.updatedAt) : 0,
    );
  async function download(proposal: DesignProposal) {
    if (!editor.image) return;
    try {
      const blob = await exportEditedImage({
        image: editor.image,
        masks: proposal.masksSnapshot,
        globalBlendMode: editor.globalBlendMode,
        placedObjects: proposal.placedObjectsSnapshot,
        placementSurfaces: proposal.placementSurfacesSnapshot,
        roomLightProfiles: proposal.roomLightProfileSnapshot ? [proposal.roomLightProfileSnapshot] : [],
      });
      downloadBlob(
        blob,
        `${normalizeExportFilename(project.activeProjectName ?? "proyecto")}-${normalizeExportFilename(proposal.name)}.png`,
      );
    } catch (error) {
      toast.error(error instanceof Error && error.message === "DECOR_ASSET_LOAD_FAILED" ? "No se pudo cargar este objeto." : "No se pudo exportar esta propuesta.");
    }
  }
  function compare() {
    if (project.compareProposals()) comparison.setMode("proposals");
  }
  return (
    <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
            Propuestas de diseño
          </p>
          <p className="mt-1 text-xs text-[#69717d]">
            {project.proposals.length} guardadas
          </p>
        </div>
        <button
          onClick={() => setSaveOpen(true)}
          disabled={!editor.image}
          className="grid h-9 w-9 place-items-center rounded-md bg-[#1f2421] text-white disabled:opacity-40"
          title="Guardar como propuesta"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {(["all", "favorites", "recent"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded border px-1 py-1.5 text-[10px] font-semibold ${filter === value ? "bg-[#1f2421] text-white" : "bg-white"}`}
          >
            {value === "all"
              ? "Todas"
              : value === "favorites"
                ? "Favoritas"
                : "Recientes"}
          </button>
        ))}
      </div>
      <input value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} placeholder="Filtrar por etiqueta..." className="mt-2 h-9 w-full rounded-md border bg-white px-2 text-xs" />
      <div className="mt-3 max-h-96 space-y-3 overflow-auto">
        {proposals.map((proposal) => {
          const selected = project.selectedProposalIds.includes(proposal.id);
          const colors = getProposalColors(proposal);
          return (
            <article
              key={proposal.id}
              className={`rounded-lg border bg-white p-2 ${selected ? "border-[#2563eb] ring-1 ring-[#2563eb]" : "border-[#e1e5ea]"}`}
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded bg-[#e8ebef]">
                {proposal.thumbnail ? (
                  <Image
                    src={proposal.thumbnail}
                    alt={proposal.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
                <button
                  onClick={() =>
                    project.updateProposal(proposal.id, {
                      isFavorite: !proposal.isFavorite,
                    })
                  }
                  aria-label="Marcar favorita"
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90"
                >
                  <Heart
                    size={14}
                    fill={proposal.isFavorite ? "#eab308" : "none"}
                  />
                </button>
                <label className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      project.toggleProposalSelection(proposal.id)
                    }
                  />
                  Comparar
                </label>
              </div>
              <div className="mt-2 flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    {proposal.name}
                  </p>
                  <div className="mt-1 flex gap-1">
                    {colors.slice(0, 5).map((color) => (
                      <span
                        key={color}
                        className="h-3.5 w-3.5 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-[#7a8290]">
                    {countColoredWalls(proposal)} paredes · {colors.length}{" "}
                    colores
                  </p>
                  {proposal.tags?.length ? <p className="mt-1 truncate text-[10px] text-[#69717d]">{proposal.tags.join(" · ")}</p> : null}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button title="Ver" onClick={() => setDetail(proposal)}>
                    <Eye size={13} />
                  </button>
                  <button
                    title="Aplicar"
                    onClick={() => setApplyTarget(proposal)}
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    title="Duplicar"
                    onClick={() => project.duplicateProposal(proposal.id)}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    title="Renombrar"
                    onClick={() => {
                      const name = window
                        .prompt("Nuevo nombre", proposal.name)
                        ?.trim();
                      if (name) project.updateProposal(proposal.id, { name });
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    title="Descargar"
                    onClick={() => void download(proposal)}
                  >
                    <Download size={13} />
                  </button>
                  <button
                    title="Eliminar"
                    onClick={() => {
                      if (window.confirm("¿Eliminar esta propuesta?"))
                        project.deleteProposal(proposal.id);
                    }}
                    className="text-[#b42318]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {project.proposals.length === 0 ? (
          <p className="rounded border border-dashed p-4 text-center text-xs text-[#7a8290]">
            Este proyecto todavía no tiene propuestas.
          </p>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={compare}
          className="h-9 rounded-md border bg-white text-xs font-semibold"
        >
          Comparar seleccionadas
        </button>
        <button
          onClick={() => comparison.setPresentationMode(true)}
          disabled={!project.proposals.length}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border bg-white text-xs font-semibold disabled:opacity-40"
        >
          <Presentation size={14} />
          Presentación
        </button>
      </div>
      <SaveProposalDialog open={saveOpen} onClose={() => setSaveOpen(false)} />
      {applyTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-semibold">¿Aplicar esta propuesta?</h2>
            <p className="mt-2 text-sm text-[#69717d]">
              Se reemplazará temporalmente el estado visual actual.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                onClick={async () => {
                  const saved = await project.createProposal({
                    name: `Propuesta ${project.proposals.length + 1}`,
                    description:
                      "Estado guardado antes de aplicar otra propuesta",
                  });
                  if (saved) {
                    project.applyProposal(applyTarget.id);
                    setApplyTarget(null);
                  }
                }}
                className="h-10 rounded-md bg-[#1f2421] text-sm font-semibold text-white"
              >
                Guardar cambios actuales como nueva propuesta
              </button>
              <button
                onClick={() => {
                  project.applyProposal(applyTarget.id);
                  setApplyTarget(null);
                }}
                className="h-10 rounded-md border text-sm font-semibold"
              >
                Aplicar sin guardar
              </button>
              <button
                onClick={() => setApplyTarget(null)}
                className="h-10 rounded-md border text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {detail ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/55 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6">
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{detail.name}</h2>
                <p className="mt-1 text-sm text-[#69717d]">
                  {detail.description}
                </p>
              </div>
              <div className="flex items-center gap-2"><FullscreenButton className="grid h-9 w-9 place-items-center rounded border" /><button onClick={() => setDetail(null)}>Cerrar</button></div>
            </div>
            <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-lg bg-[#e8ebef]">
              {editor.image ? <Image src={editor.image.url} alt="Original" fill unoptimized className="object-contain" /> : null}
              {detail.thumbnail ? (
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - detailPosition}% 0 0)` }}><Image src={detail.thumbnail} alt={detail.name} fill unoptimized className="object-contain" /></div>
              ) : null}
              <input type="range" min="0" max="100" value={detailPosition} onChange={(event) => setDetailPosition(Number(event.target.value))} aria-label="Comparar original y propuesta" className="absolute bottom-4 left-1/2 w-2/3 -translate-x-1/2 accent-white" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <p className="text-sm">
                <b>Paredes:</b> {countColoredWalls(detail)}
              </p>
              <p className="text-sm">
                <b>Colores:</b> {getProposalColors(detail).length}
              </p>
              <p className="text-sm">
                <b>Dominante:</b> {getDominantColor(detail) ?? "-"}
              </p>
              <p className="text-sm">
                <b>Mezcla:</b> {getMostUsedBlendMode(detail)}
              </p>
            </div>
            <button
              onClick={() => void download(detail)}
              className="mt-5 h-10 rounded-md bg-[#1f2421] px-4 text-sm font-semibold text-white"
            >
              Descargar propuesta
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
