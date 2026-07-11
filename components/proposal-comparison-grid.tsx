"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { FullscreenButton } from "@/components/fullscreen-button";
import { useComparison } from "@/components/comparison-context";
import { useProject } from "@/components/project-context";
import { getProposalColors } from "@/lib/proposals/proposalStatistics";

export function ProposalComparisonGrid({
  onExpand,
}: {
  onExpand?: (id: string) => void;
}) {
  const project = useProject();
  const comparison = useComparison();
  const [applyId, setApplyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const proposals = project.proposals.filter((proposal) =>
    project.selectedProposalIds.includes(proposal.id),
  );
  if (proposals.length < 2 || proposals.length > 4)
    return (
      <div className="grid min-h-[480px] place-items-center p-8 text-center">
        <div>
          <p className="font-semibold text-[#30343b]">
            Selecciona entre 2 y 4 propuestas.
          </p>
          <p className="mt-2 text-sm text-[#69717d]">
            Usa las casillas del panel “Propuestas de diseño”.
          </p>
        </div>
      </div>
    );
  const detail = proposals.find((proposal) => proposal.id === detailId);
  return <>
    <div
      className={`grid min-h-[480px] gap-3 p-4 ${proposals.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2"}`}
    >
      {proposals.map((proposal) => (
        <article
          key={proposal.id}
          className="overflow-hidden rounded-lg border bg-white"
        >
          <div className="relative aspect-[16/10] bg-[#e8ebef]">
            {proposal.thumbnail ? (
              <Image
                src={proposal.thumbnail}
                alt={proposal.name}
                fill
                unoptimized
                className="object-contain"
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <div>
              <h3 className="font-semibold">{proposal.name}</h3>
              <div className="mt-1 flex gap-1">
                {getProposalColors(proposal)
                  .slice(0, 6)
                  .map((color) => (
                    <span
                      key={color}
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setApplyId(proposal.id)}
                className="rounded border px-2 py-1 text-xs font-semibold"
              >
                Activar
              </button>
              <button
                onClick={() => { setDetailId(proposal.id); onExpand?.(proposal.id); }}
                aria-label={`Ampliar ${proposal.name}`}
                className="grid h-8 w-8 place-items-center rounded border"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
    {applyId ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6"><h2 className="text-lg font-semibold">¿Aplicar esta propuesta?</h2><div className="mt-5 grid gap-2"><button onClick={async () => { const saved = await project.createProposal({ name: `Propuesta ${project.proposals.length + 1}`, description: "Estado anterior a otra propuesta" }); if (saved) { project.applyProposal(applyId); comparison.setMode("edited"); setApplyId(null); } }} className="h-10 rounded bg-[#1f2421] text-sm font-semibold text-white">Guardar cambios actuales como nueva propuesta</button><button onClick={() => { project.applyProposal(applyId); comparison.setMode("edited"); setApplyId(null); toast.success("Propuesta aplicada."); }} className="h-10 rounded border text-sm font-semibold">Aplicar sin guardar</button><button onClick={() => setApplyId(null)} className="h-10 rounded border text-sm font-semibold">Cancelar</button></div></div></div> : null}
    {detail ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="w-full max-w-5xl rounded-xl bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">{detail.name}</h2><p className="mt-1 text-sm text-[#69717d]">{detail.description}</p></div><div className="flex gap-2"><FullscreenButton className="grid h-9 w-9 place-items-center rounded border" /><button onClick={() => setDetailId(null)}>Cerrar</button></div></div><div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-lg bg-[#e8ebef]">{detail.thumbnail ? <Image src={detail.thumbnail} alt={detail.name} fill unoptimized className="object-contain" /> : null}</div><div className="mt-4 flex gap-2">{getProposalColors(detail).map((color) => <span key={color} className="h-8 w-8 rounded-full border" style={{ backgroundColor: color }} />)}</div></div></div> : null}
  </>;
}
