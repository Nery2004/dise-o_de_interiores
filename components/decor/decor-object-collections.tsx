"use client";

import { Clock3, Heart, TrendingUp } from "lucide-react";
import { DecorObjectPreview } from "@/components/decor/decor-object-preview";
import type { DecorObject } from "@/types/decor-object";

function DecorObjectStrip({ title, icon, objects, onOpen }: { title: string; icon: React.ReactNode; objects: DecorObject[]; onOpen: (object: DecorObject) => void }) {
  if (!objects.length) return null;
  return <section className="mt-9" aria-label={title}><div className="mb-4 flex items-center gap-2"><span className="text-[#687369]">{icon}</span><h2 className="text-xl font-semibold text-[#202621]">{title}</h2></div><div className="flex snap-x gap-3 overflow-x-auto pb-3">{objects.map((object) => <button key={object.id} type="button" onClick={() => onOpen(object)} aria-label={`Abrir ${object.name}`} className="w-36 shrink-0 snap-start rounded-xl border border-[#ddd6ca] bg-white p-2 text-left shadow-sm transition hover:border-[#9daa98]"><span className="block aspect-square overflow-hidden rounded-lg bg-[#f2eee6]"><DecorObjectPreview object={object} sizes="144px" className="h-full w-full" /></span><span className="mt-2 block truncate px-1 text-xs font-semibold">{object.name}</span></button>)}</div></section>;
}

export function DecorObjectFavorites({ objects, onOpen }: { objects: DecorObject[]; onOpen: (object: DecorObject) => void }) {
  return <DecorObjectStrip title="Favoritos" icon={<Heart size={20} />} objects={objects} onOpen={onOpen} />;
}

export function RecentDecorObjects({ objects, onOpen }: { objects: DecorObject[]; onOpen: (object: DecorObject) => void }) {
  return <DecorObjectStrip title="Usados recientemente" icon={<Clock3 size={20} />} objects={objects} onOpen={onOpen} />;
}

export function MostUsedDecorObjects({ objects, onOpen }: { objects: DecorObject[]; onOpen: (object: DecorObject) => void }) {
  return <DecorObjectStrip title="Más usados" icon={<TrendingUp size={20} />} objects={objects} onOpen={onOpen} />;
}
