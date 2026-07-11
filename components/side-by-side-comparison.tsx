"use client";

import Image from "next/image";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useEditor } from "@/components/editor-context";
import { RenderedEditorImage } from "@/components/rendered-editor-image";

export function IndependentSideBySideComparison() {
  const { image, zoom } = useEditor();
  if (!image) return null;
  const views = ["original", "edited"] as const;
  return <div className="grid min-h-[480px] gap-2 p-3 md:grid-cols-2">{views.map((view) => <div key={view} className="relative min-h-[450px] overflow-hidden rounded-md bg-[#dfe3e8]"><span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white">{view === "original" ? "Original" : "Editada"}</span><TransformWrapper initialScale={zoom} minScale={0.1} maxScale={8} centerOnInit><TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-full !w-full"><div className="flex h-[450px] w-full items-center justify-center p-4"><div className="relative shrink-0" style={{ width: image.dimensions.width, height: image.dimensions.height }}>{view === "original" ? <Image src={image.url} alt="Original" fill unoptimized className="object-contain" /> : <RenderedEditorImage />}</div></div></TransformComponent></TransformWrapper></div>)}</div>;
}
