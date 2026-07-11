"use client";

import { Heart, PaintBucket } from "lucide-react";
import { getRecommendedTextColor } from "@/lib/colors/colorContrast";
import type { InteriorColor } from "@/types/color";

export function ColorCard({ color, favorite, onFavorite, onOpen, onUse }: { color: InteriorColor; favorite: boolean; onFavorite: () => void; onOpen: () => void; onUse: () => void }) {
  const textColor = getRecommendedTextColor(color.hex);
  return <article className="overflow-hidden rounded-xl border border-[#ded6c9] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <button type="button" onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(); }} aria-label={`Ver detalles de ${color.name}`} className="relative block h-36 w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]" style={{ backgroundColor: color.hex, color: textColor }}><span className="absolute bottom-3 left-3 rounded bg-black/15 px-2 py-1 font-mono text-xs backdrop-blur">{color.hex}</span></button>
    <div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-[#202124]">{color.name}</h3><p className="mt-1 text-xs capitalize text-[#7a8290]">{color.category} · {color.undertone}</p></div><button type="button" title={favorite ? "Quitar de favoritos" : "Marcar favorito"} aria-label={favorite ? `Quitar ${color.name} de favoritos` : `Marcar ${color.name} como favorito`} onClick={onFavorite} className="grid h-9 w-9 place-items-center rounded-full border border-[#e1e5ea] focus-visible:outline-2 focus-visible:outline-[#2563eb]"><Heart size={17} fill={favorite ? "#dc2626" : "none"} color={favorite ? "#dc2626" : "#69717d"} /></button></div><button type="button" onClick={onUse} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"><PaintBucket size={14} />Usar en editor</button></div>
  </article>;
}
