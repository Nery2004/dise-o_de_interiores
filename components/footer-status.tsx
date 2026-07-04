"use client";

import { useEditor } from "@/components/editor-context";
import { editorTools } from "@/lib/editor-data";

function statusLabel(status: string) {
  if (status === "loading") {
    return "Cargando";
  }

  if (status === "ready") {
    return "Listo";
  }

  if (status === "detecting") {
    return "Detectando paredes...";
  }

  if (status === "exporting") {
    return "Exportando...";
  }

  if (status === "error") {
    return "Error";
  }

  return "Sin imagen";
}

export function FooterStatus() {
  const {
    activeColor,
    activeTool,
    dimensions,
    masks,
    selectedMaskId,
    status,
    zoom,
  } = useEditor();
  const resolution = dimensions
    ? `${dimensions.width}x${dimensions.height}`
    : "-";
  const toolLabel =
    editorTools.find((tool) => tool.id === activeTool)?.label ?? activeTool;
  const selectedMask =
    masks.find((mask) => mask.id === selectedMaskId)?.name ?? "-";

  return (
    <footer className="flex min-h-10 flex-wrap items-center gap-4 border-t border-[#dde1e7] bg-white px-4 text-xs font-medium text-[#5f6875] shadow-sm">
      <span>{Math.round(zoom * 100)}%</span>
      <span>{resolution}</span>
      <span>{statusLabel(status)}</span>
      <span>Herramienta: {toolLabel}</span>
      <span>Pared: {selectedMask}</span>
      <span>Color: {activeColor ?? "-"}</span>
    </footer>
  );
}
