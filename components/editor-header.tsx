"use client";

import { Download, FolderOpen, FolderKanban, Home, ImagePlus, Redo2, Save, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { downloadBlob, exportEditedImage } from "@/lib/exportImage";
import { maskHasExportableColor } from "@/lib/mask-geometry";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project-context";

function HeaderButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white px-3 text-sm font-medium text-[#30343b] shadow-sm transition",
        "hover:border-[#c9d1dc] hover:bg-[#f8fafc]",
        disabled && "cursor-not-allowed opacity-45 hover:border-[#dfe3e8] hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}

export function EditorHeader() {
  const project = useProject();
  const {
    globalBlendMode,
    canRedo,
    canUndo,
    image,
    masks,
    setStatus,
    status,
    redo,
    undo,
  } = useEditor();
  const isExporting = status === "exporting";

  async function handleDownload() {
    if (!image) {
      toast.error("Primero sube una imagen.");
      return;
    }

    if (!masks.some(maskHasExportableColor)) {
      toast.error("Aplica un color a una pared antes de descargar.");
      return;
    }

    try {
      setStatus("exporting");
      const blob = await exportEditedImage({
        globalBlendMode,
        image,
        masks,
      });

      downloadBlob(blob, "interior-color-studio-export.png");
      toast.success("Imagen descargada correctamente.");
    } catch {
      toast.error("No se pudo exportar la imagen.");
    } finally {
      setStatus("ready");
    }
  }

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#dde1e7] bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#1f2421] text-white">
          <Sparkles size={18} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#202124]">
            Interior Color Studio
          </p>
          <p className="truncate text-xs text-[#69717d]">
            {project.activeProjectName ?? "Proyecto sin guardar"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => project.navigateWithGuard("/")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white px-3 text-sm font-medium text-[#30343b] shadow-sm transition hover:border-[#c9d1dc] hover:bg-[#f8fafc]"
        >
          <Home size={16} />
          Home
        </button>
        <button type="button" onClick={() => project.navigateWithGuard("/projects")} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white px-3 text-sm font-medium text-[#30343b] shadow-sm"><FolderKanban size={16} />Mis proyectos</button>
        <button type="button" onClick={() => project.navigateWithGuard(project.activeProjectId ? `/colors?project=${encodeURIComponent(project.activeProjectId)}` : "/colors")} className="inline-flex h-10 items-center justify-center rounded-md border border-[#dfe3e8] bg-white px-3 text-sm font-medium text-[#30343b] shadow-sm">Colores</button>
        <HeaderButton onClick={project.openImageAsNewProject}>
          <FolderOpen size={16} />
          Abrir imagen
        </HeaderButton>
        <HeaderButton onClick={project.createNewProject}>
          <ImagePlus size={16} />
          Nuevo proyecto
        </HeaderButton>
        <HeaderButton disabled={!image || project.isSaving} onClick={project.requestSave}>
          <Save size={16} />
          {project.isSaving ? "Guardando..." : "Guardar proyecto"}
        </HeaderButton>
        <HeaderButton disabled={!canUndo} onClick={undo}>
          <Undo2 size={16} />
          Deshacer
        </HeaderButton>
        <HeaderButton disabled={!canRedo} onClick={redo}>
          <Redo2 size={16} />
          Rehacer
        </HeaderButton>
        <HeaderButton disabled={isExporting} onClick={() => void handleDownload()}>
          <Download size={16} />
          {isExporting ? "Exportando..." : "Descargar"}
        </HeaderButton>
      </div>
    </header>
  );
}
