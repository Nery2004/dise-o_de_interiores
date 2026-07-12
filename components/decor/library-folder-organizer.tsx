"use client";

import { useState } from "react";
import { useDecorObjects } from "@/components/use-decor-objects";
import { decorObjectsById } from "@/data/decorObjects";

export function LibraryFolderOrganizer() {
  const decor = useDecorObjects();
  const [favoriteId, setFavoriteId] = useState(decor.favorites[0] ?? "");
  if (!decor.folders.length || !decor.favorites.length) return null;
  return <section className="mt-3 rounded-2xl border bg-white/80 p-4"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">Guardar favoritos en carpeta</h3><select value={favoriteId} onChange={(event) => setFavoriteId(event.target.value)} className="ml-auto h-9 rounded border px-2 text-xs">{decor.favorites.map((id) => <option key={id} value={id}>{decorObjectsById.get(id)?.name ?? id}</option>)}</select></div><div className="mt-3 flex flex-wrap gap-2">{decor.folders.map((folder) => <button key={folder.id} type="button" disabled={!favoriteId} onClick={() => void decor.toggleObjectInFolder(folder.id, favoriteId)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${folder.objectIds.includes(favoriteId) ? "bg-[#202621] text-white" : "bg-white"}`}>{folder.name}{folder.objectIds.includes(favoriteId) ? " ✓" : ""}</button>)}</div></section>;
}
