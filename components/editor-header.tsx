"use client";

import { Download, FolderOpen, FolderKanban, Home, ImagePlus, Redo2, Save, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { downloadBlob, exportEditedImage } from "@/lib/exportImage";
import { maskHasExportableColor } from "@/lib/mask-geometry";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project-context";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useRoomLighting } from "@/components/room-lighting-context";
import { useState } from "react";

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
  const placement = useDecorPlacement();
  const lighting = useRoomLighting();
  const [exportMode, setExportMode] = useState<"all" | "objects" | "paint">("all");
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

    if (!masks.some(maskHasExportableColor) && !placement.placedObjects.some((object) => object.visible)) {
      toast.error("Aplica un color o coloca un objeto antes de descargar.");
      return;
    }

    try {
      setStatus("exporting");
      const blob = await exportEditedImage({
        globalBlendMode,
        image,
        masks: exportMode === "objects" ? [] : masks,
        placedObjects: exportMode === "paint" ? [] : placement.placedObjects,
        placementSurfaces: placement.placementSurfaces,
        roomLightProfiles: lighting.profiles,
        includeOriginal: exportMode !== "objects",
      });

      downloadBlob(blob, "interior-color-studio-export.png");
      toast.success("Imagen descargada correctamente.");
    } catch (error) {
      toast.error(error instanceof Error && error.message === "DECOR_ASSET_LOAD_FAILED" ? "No se pudo cargar este objeto." : "No se pudo exportar la imagen.");
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
        <button type="button" onClick={() => project.navigateWithGuard("/objects")} className="inline-flex h-10 items-center justify-center rounded-md border border-[#dfe3e8] bg-white px-3 text-sm font-medium text-[#30343b] shadow-sm">Objetos</button>
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
        <HeaderButton disabled={!canUndo && !placement.canUndo && !lighting.canUndo} onClick={placement.canUndo ? placement.undo : lighting.canUndo ? lighting.undo : undo}>
          <Undo2 size={16} />
          Deshacer
        </HeaderButton>
        <HeaderButton disabled={!canRedo && !placement.canRedo && !lighting.canRedo} onClick={placement.canRedo ? placement.redo : lighting.canRedo ? lighting.redo : redo}>
          <Redo2 size={16} />
          Rehacer
        </HeaderButton>
        <select aria-label="Contenido de exportación" value={exportMode} onChange={(event) => setExportMode(event.target.value as typeof exportMode)} className="h-10 rounded-md border bg-white px-2 text-xs font-semibold"><option value="all">Exportar todo</option><option value="objects">Solo objetos</option><option value="paint">Solo pintura</option></select>
        <HeaderButton disabled={isExporting} onClick={() => void handleDownload()}>
          <Download size={16} />
          {isExporting ? "Exportando..." : "Descargar"}
        </HeaderButton>
      </div>
    </header>
  );
}
