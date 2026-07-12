import { PackageSearch } from "lucide-react";
import { DecorObjectCard } from "@/components/decor/decor-object-card";
import type { DecorObject } from "@/types/decor-object";

export function DecorObjectGrid({ objects, favorites, onOpen, onFavorite, onUse }: { objects: DecorObject[]; favorites: string[]; onOpen: (object: DecorObject) => void; onFavorite: (id: string) => void; onUse: (object: DecorObject) => void }) {
  if (!objects.length) return <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-[#cbc4b8] bg-white/55 p-8 text-center"><div><PackageSearch size={34} className="mx-auto text-[#788078]" /><h2 className="mt-4 text-lg font-semibold">No encontramos objetos</h2><p className="mt-2 text-sm text-[#697169]">Prueba otra búsqueda o limpia los filtros.</p></div></div>;
  const favoriteSet = new Set(favorites);
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{objects.map((object) => <DecorObjectCard key={object.id} object={object} favorite={favoriteSet.has(object.id)} onOpen={() => onOpen(object)} onFavorite={() => onFavorite(object.id)} onUse={() => onUse(object)} />)}</div>;
}
