"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useComparison } from "@/components/comparison-context";
import { useEditor } from "@/components/editor-context";
import { useProject } from "@/components/project-context";
import { getProposalColors } from "@/lib/proposals/proposalStatistics";
import { FullscreenButton } from "@/components/fullscreen-button";

export function PresentationMode() {
  const comparison = useComparison();
  const editor = useEditor();
  const project = useProject();
  const startIndex = Math.max(
    0,
    project.proposals.findIndex(
      (proposal) => proposal.id === project.activeProposalId,
    ),
  );
  const [index, setIndex] = useState(startIndex);
  const [view, setView] = useState<"original" | "edited" | "compare">("edited");
  const [position, setPosition] = useState(50);
  const proposal = project.proposals[index];
  const colors = useMemo(
    () => (proposal ? getProposalColors(proposal) : []),
    [proposal],
  );
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
          event.target.isContentEditable)
      )
        return;
      if (event.key === "ArrowRight")
        setIndex(
          (current) => (current + 1) % Math.max(1, project.proposals.length),
        );
      if (event.key === "ArrowLeft")
        setIndex(
          (current) =>
            (current - 1 + project.proposals.length) %
            Math.max(1, project.proposals.length),
        );
      if (event.key.toLowerCase() === "o") setView("original");
      if (event.key.toLowerCase() === "e") setView("edited");
      if (event.key.toLowerCase() === "c") setView("compare");
      if (event.key.toLowerCase() === "f" && document.fullscreenEnabled)
        void document.documentElement.requestFullscreen();
      if (event.key === "Escape" && !document.fullscreenElement)
        comparison.setPresentationMode(false);
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [comparison, project.proposals.length]);
  if (!editor.image || !proposal)
    return (
      <div className="grid min-h-screen place-items-center bg-[#11151a] text-white">
        <div className="text-center">
          <p>Este proyecto todavía no tiene propuestas.</p>
          <button
            onClick={() => comparison.setPresentationMode(false)}
            className="mt-4 rounded border px-4 py-2"
          >
            Volver
          </button>
        </div>
      </div>
    );
  return (
    <main className="flex min-h-screen flex-col bg-[#11151a] text-white">
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">
            {project.activeProjectName}
          </p>
          <h1 className="mt-1 text-xl font-semibold">{proposal.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("original")}
            className={`rounded px-3 py-2 text-sm ${view === "original" ? "bg-white text-black" : "bg-white/10"}`}
          >
            Original
          </button>
          <button
            onClick={() => setView("edited")}
            className={`rounded px-3 py-2 text-sm ${view === "edited" ? "bg-white text-black" : "bg-white/10"}`}
          >
            Propuesta
          </button>
          <button
            onClick={() => setView("compare")}
            className={`rounded px-3 py-2 text-sm ${view === "compare" ? "bg-white text-black" : "bg-white/10"}`}
          >
            Comparar
          </button>
          <FullscreenButton className="grid h-10 w-10 place-items-center rounded bg-white/10" />
          <button
            onClick={() => comparison.setPresentationMode(false)}
            aria-label="Salir de presentación"
            className="grid h-10 w-10 place-items-center rounded bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="flex flex-1 items-center gap-4 px-4">
        <button
          onClick={() =>
            setIndex(
              (index - 1 + project.proposals.length) % project.proposals.length,
            )
          }
          aria-label="Propuesta anterior"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10"
        >
          <ChevronLeft />
        </button>
        <div className="relative mx-auto aspect-[16/10] max-h-[75vh] w-full max-w-6xl overflow-hidden rounded-lg bg-black shadow-2xl">
          <Image
            src={editor.image.url}
            alt="Imagen original"
            fill
            unoptimized
            className="object-contain"
          />
          {view !== "original" && proposal.thumbnail ? (
            <div
              className="absolute inset-0"
              style={
                view === "compare"
                  ? { clipPath: `inset(0 ${100 - position}% 0 0)` }
                  : undefined
              }
            >
              <Image
                src={proposal.thumbnail}
                alt={proposal.name}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ) : null}
          {view === "compare" ? (
            <input
              type="range"
              min="0"
              max="100"
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              aria-label="Posición del comparador"
              className="absolute bottom-5 left-1/2 w-2/3 -translate-x-1/2 accent-white"
            />
          ) : null}
        </div>
        <button
          onClick={() => setIndex((index + 1) % project.proposals.length)}
          aria-label="Propuesta siguiente"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10"
        >
          <ChevronRight />
        </button>
      </div>
      <footer className="flex items-center justify-center gap-3 px-5 py-4">
        {colors.map((color) => (
          <span
            key={color}
            className="h-8 w-8 rounded-full border border-white/30"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <span className="ml-3 text-sm text-white/55">
          {index + 1} / {project.proposals.length}
        </span>
      </footer>
    </main>
  );
}
