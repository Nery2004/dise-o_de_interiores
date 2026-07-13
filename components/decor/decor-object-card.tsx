"use client";

import { Heart, MoveUpRight } from "lucide-react";
import { memo } from "react";
import { DecorObjectPreview } from "@/components/decor/decor-object-preview";
import { decorCategoryLabels, decorRoomLabels, decorStyleLabels, isSelectableDecorObject, type DecorObject } from "@/types/decor-object";

export const DecorObjectCard = memo(function DecorObjectCard({ object, favorite, onOpen, onFavorite, onUse }: { object: DecorObject; favorite: boolean; onOpen: () => void; onFavorite: () => void; onUse: () => void }) {
  const valid = isSelectableDecorObject(object);
  return <article className="group overflow-hidden rounded-2xl border border-[#ddd6ca] bg-white shadow-[0_8px_24px_rgba(48,45,38,.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(48,45,38,.12)]">
    <div className="relative aspect-square bg-[radial-gradient(circle_at_50%_35%,#fff_0,#f2eee6_72%)]">
      <button type="button" onClick={onOpen} aria-label={`Ver detalle de ${object.name}`} className="block h-full w-full p-4 focus-visible:outline-offset-[-4px]"><DecorObjectPreview object={object} className="h-full w-full transition duration-300 group-hover:scale-[1.04]" /></button>
      <button type="button" onClick={onFavorite} aria-label={favorite ? `Quitar ${object.name} de favoritos` : `Marcar ${object.name} como favorito`} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-[#5a625b] shadow-sm backdrop-blur hover:text-[#b14d57]"><Heart size={18} fill={favorite ? "#b14d57" : "none"} className={favorite ? "text-[#b14d57]" : ""} /></button>
    </div>
    <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a827b]">{decorCategoryLabels[object.category]} · {decorStyleLabels[object.style]}</p><h3 className="mt-1.5 line-clamp-2 font-semibold text-[#202621]">{object.name}</h3></div></div><p className="mt-2 truncate text-xs text-[#697169]">{(object.recommendedRooms ?? []).map((room) => decorRoomLabels[room]).join(" · ") || "Sin habitación recomendada"}</p><button type="button" onClick={onUse} disabled={!valid} aria-label={valid ? `Usar en editor: ${object.name}` : `Asset no disponible: ${object.name} no tiene dimensiones válidas`} title={valid ? undefined : "Este asset tiene dimensiones inválidas."} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#202621] px-3 text-sm font-semibold text-white transition hover:bg-[#50634f] disabled:cursor-not-allowed disabled:bg-[#a7ada8]"><MoveUpRight size={16} />{valid ? "Usar en editor" : "Asset no disponible"}</button></div>
  </article>;
});
