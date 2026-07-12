"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, FolderPlus, PackageOpen, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useDecorObjects } from "@/components/use-decor-objects";
import { DecorObjectDetailDialog } from "@/components/decor/decor-object-detail-dialog";
import { DecorObjectFilters } from "@/components/decor/decor-object-filters";
import { DecorObjectGrid } from "@/components/decor/decor-object-grid";
import { DecorObjectSearch } from "@/components/decor/decor-object-search";
import { DecorObjectFavorites, MostUsedDecorObjects, RecentDecorObjects } from "@/components/decor/decor-object-collections";
import { PremiumCategoryNav } from "@/components/decor/premium-category-nav";
import { LibraryFolderOrganizer } from "@/components/decor/library-folder-organizer";
import { decorObjects } from "@/data/decorObjects";
import { EMPTY_DECOR_FILTERS, filterDecorObjects } from "@/lib/decor/filterDecorObjects";
import { decorCollectionIds, decorCollectionLabels, type DecorObject } from "@/types/decor-object";

function useDebouncedValue(value: string, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [delay, value]);
  return debounced;
}

export function DecorObjectsPage() {
  const router = useRouter();
  const decor = useDecorObjects();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_DECOR_FILTERS);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [folderName, setFolderName] = useState("");
  const deferredQuery = useDeferredValue(useDebouncedValue(query));
  const colors = useMemo(() => [...new Set(decorObjects.flatMap((object) => object.dominantColors ?? []))].sort(), []);
  const results = useMemo(() => filterDecorObjects(decorObjects, deferredQuery, filters, decor.favorites), [decor.favorites, deferredQuery, filters]);
  const favoriteObjects = useMemo(() => { const set = new Set(decor.favorites); return decorObjects.filter((object) => set.has(object.id)); }, [decor.favorites]);

  async function prepareInEditor(object: DecorObject) {
    try {
      if (!await decor.setPendingDecorObject(object)) return toast.error("Este objeto tiene dimensiones inválidas.");
      decor.setSelectedDecorObject(object);
      router.push("/editor");
    } catch { toast.error("No se pudo preparar el objeto."); }
  }

  return <main id="contenido" className="min-h-screen bg-[#f4f0e7] px-4 py-9 sm:px-8 lg:px-10"><div className="mx-auto max-w-[1500px]">
    <header className="grid gap-5 lg:grid-cols-[1fr_minmax(360px,560px)] lg:items-end"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#667469]"><PackageOpen size={16} />Biblioteca premium</div><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#1f2421] sm:text-5xl">Catálogo profesional de interiorismo</h1><p className="mt-3 max-w-2xl leading-7 text-[#687169]">Organiza objetos por categoría, colección, favoritos y carpetas de cliente.</p></div><DecorObjectSearch value={query} onChange={setQuery} /></header>
    <PremiumCategoryNav objects={decorObjects} selected={filters.category} onSelect={(category) => setFilters((current) => ({ ...current, category }))} />
    <nav aria-label="Colecciones" className="mt-5 flex gap-2 overflow-x-auto pb-2"><button type="button" onClick={() => setFilters((current) => ({ ...current, collection: "" }))} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${!filters.collection ? "bg-[#202621] text-white" : "bg-white"}`}>Todas las colecciones</button>{decorCollectionIds.map((collection) => <button key={collection} type="button" onClick={() => setFilters((current) => ({ ...current, collection }))} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${filters.collection === collection ? "bg-[#202621] text-white" : "bg-white"}`}>{decorCollectionLabels[collection]}</button>)}</nav>
    <RecentDecorObjects objects={decor.recentObjects} onOpen={decor.setSelectedDecorObject} />
    <DecorObjectFavorites objects={favoriteObjects} onOpen={decor.setSelectedDecorObject} />
    <MostUsedDecorObjects objects={decor.mostUsedObjects} onOpen={decor.setSelectedDecorObject} />
    <section className="mt-8 rounded-2xl border bg-white/80 p-4"><div className="flex flex-wrap items-center gap-2"><FolderPlus size={18} /><h2 className="font-semibold">Carpetas</h2><input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Proyecto Casa…" className="ml-auto h-9 rounded-lg border px-3 text-sm" /><button type="button" onClick={() => { void decor.createFolder(folderName); setFolderName(""); }} className="h-9 rounded-lg bg-[#202621] px-3 text-xs font-semibold text-white">Crear carpeta</button></div><div className="mt-3 flex gap-2 overflow-x-auto">{decor.folders.map((folder) => <div key={folder.id} className="min-w-44 rounded-xl border bg-white p-3"><div className="flex items-center justify-between"><span className="truncate text-xs font-semibold">{folder.name}</span><button type="button" aria-label={`Eliminar ${folder.name}`} onClick={() => void decor.deleteFolder(folder.id)}><Trash2 size={13} /></button></div><p className="mt-1 text-[10px] text-[#687169]">{folder.objectIds.length} favoritos guardados</p></div>)}</div></section>
    <LibraryFolderOrganizer />
    <div className="mt-9 flex items-center justify-between gap-4 border-y border-[#d8d1c5] py-4"><p className="text-sm"><strong>{results.length}</strong> objetos encontrados</p><button type="button" onClick={() => setMobileFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold lg:hidden"><Filter size={16} />Filtros</button></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[245px_minmax(0,1fr)]"><div className="hidden lg:block"><DecorObjectFilters filters={filters} colors={colors} onChange={setFilters} onClear={() => { setFilters(EMPTY_DECOR_FILTERS); setQuery(""); }} /></div><DecorObjectGrid objects={results} favorites={decor.favorites} onOpen={decor.setSelectedDecorObject} onFavorite={(id) => void decor.toggleFavorite(id)} onUse={(object) => void prepareInEditor(object)} /></div>
  </div>{mobileFilters ? <DecorObjectFilters mobile filters={filters} colors={colors} onChange={setFilters} onClear={() => setFilters(EMPTY_DECOR_FILTERS)} onClose={() => setMobileFilters(false)} /> : null}{decor.selectedDecorObject ? <DecorObjectDetailDialog object={decor.selectedDecorObject} objects={decorObjects} favorite={decor.favorites.includes(decor.selectedDecorObject.id)} onClose={() => decor.setSelectedDecorObject(null)} onFavorite={() => void decor.toggleFavorite(decor.selectedDecorObject!.id)} onUse={() => void prepareInEditor(decor.selectedDecorObject!)} onOpenSimilar={decor.setSelectedDecorObject} /> : null}<Toaster richColors position="top-right" /></main>;
}
