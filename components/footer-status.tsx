"use client";

import { useEditor } from "@/components/editor-context";

function statusLabel(status: string) {
  if (status === "loading") {
    return "Cargando";
  }

  if (status === "ready") {
    return "Listo";
  }

  if (status === "error") {
    return "Error";
  }

  return "Sin imagen";
}

export function FooterStatus() {
  const { dimensions, status, zoom } = useEditor();
  const resolution = dimensions
    ? `${dimensions.width}x${dimensions.height}`
    : "-";

  return (
    <footer className="flex min-h-10 flex-wrap items-center gap-4 border-t border-[#dde1e7] bg-white px-4 text-xs font-medium text-[#5f6875] shadow-sm">
      <span>{Math.round(zoom * 100)}%</span>
      <span>{resolution}</span>
      <span>{statusLabel(status)}</span>
    </footer>
  );
}
