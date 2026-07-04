"use client";

import Link from "next/link";
import { Download, FolderOpen, Home, ImagePlus, Sparkles } from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { cn } from "@/lib/utils";

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
  const { openImageDialog, resetImage } = useEditor();

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
            Professional image editor
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe3e8] bg-white px-3 text-sm font-medium text-[#30343b] shadow-sm transition hover:border-[#c9d1dc] hover:bg-[#f8fafc]"
        >
          <Home size={16} />
          Home
        </Link>
        <HeaderButton onClick={openImageDialog}>
          <FolderOpen size={16} />
          Abrir imagen
        </HeaderButton>
        <HeaderButton onClick={resetImage}>
          <ImagePlus size={16} />
          Nueva imagen
        </HeaderButton>
        <HeaderButton disabled>
          <Download size={16} />
          Descargar
        </HeaderButton>
      </div>
    </header>
  );
}
