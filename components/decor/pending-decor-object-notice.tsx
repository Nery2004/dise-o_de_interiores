"use client";

import { Armchair } from "lucide-react";
import { DecorObjectPreview } from "@/components/decor/decor-object-preview";
import { useDecorObjects } from "@/components/use-decor-objects";
import { useEditor } from "@/components/editor-context";

export function PendingDecorObjectNotice() {
  const decor = useDecorObjects();
  const editor = useEditor();
  if (!decor.pendingDecorObject || editor.activeTool === "objects") return null;
  return <section className="mb-5 rounded-xl border border-[#b9c7b1] bg-[#eef3eb] p-3" aria-live="polite"><div className="flex items-center gap-3"><span className="h-14 w-14 shrink-0 rounded-lg bg-white"><DecorObjectPreview object={decor.pendingDecorObject} sizes="56px" className="h-full w-full" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#50634f]">Objeto listo para colocar</p><p className="mt-1 truncate text-sm font-semibold">{decor.pendingDecorObject.name}</p></div></div><button type="button" onClick={() => editor.setActiveTool("objects")} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#aab9a6] bg-white text-xs font-semibold"><Armchair size={14} />Abrir panel de objetos</button></section>;
}
