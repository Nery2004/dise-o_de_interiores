"use client";

import Image from "next/image";
import { useEditor } from "@/components/editor-context";
import { RenderedEditorImage } from "@/components/rendered-editor-image";

export function IndependentSideBySideComparison() {
  const { image } = useEditor();
  if (!image) return null;

  return (
    <div className="grid min-h-[480px] gap-2 p-3 pt-16 md:grid-cols-2">
      <div className="relative min-h-[420px] overflow-hidden rounded-md bg-[#dfe3e8]">
        <span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white">
          Original
        </span>
        <Image
          src={image.url}
          alt="Original"
          fill
          unoptimized
          draggable={false}
          className="canvas-fixed-image object-contain p-4"
        />
      </div>
      <div className="relative min-h-[420px] overflow-hidden rounded-md bg-[#dfe3e8] p-4">
        <span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white">
          Editada
        </span>
        <RenderedEditorImage className="absolute inset-0 object-contain p-4" />
      </div>
    </div>
  );
}
