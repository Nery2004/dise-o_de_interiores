"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, PackageOpen } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useDecorObjects } from "@/components/use-decor-objects";
import { DecorObjectDetailDialog } from "@/components/decor/decor-object-detail-dialog";
import { DecorObjectFilters } from "@/components/decor/decor-object-filters";
import { DecorObjectGrid } from "@/components/decor/decor-object-grid";
import { DecorObjectSearch } from "@/components/decor/decor-object-search";
import { DecorObjectFavorites, RecentDecorObjects } from "@/components/decor/decor-object-collections";
import { decorObjects } from "@/data/decorObjects";
import { EMPTY_DECOR_FILTERS, filterDecorObjects } from "@/lib/decor/filterDecorObjects";
import { decorCategoryLabels, decorObjectCategories, type DecorObject } from "@/types/decor-object";

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
  const debouncedQuery = useDebouncedValue(query);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const colors = useMemo(() => [...new Set(decorObjects.flatMap((object) => object.dominantColors ?? []))].sort(), []);
  const results = useMemo(() => filterDecorObjects(decorObjects, deferredQuery, filters, decor.favorites), [decor.favorites, deferredQuery, filters]);
  const favoriteObjects = useMemo(() => { const set = new Set(decor.favorites); return decorObjects.filter((object) => set.has(object.id)); }, [decor.favorites]);

  async function prepareInEditor(object: DecorObject) {
    try {
      const selected = await decor.setPendingDecorObject(object);
      if (!selected) { toast.error("Este objeto tiene dimensiones inválidas y no puede seleccionarse."); return; }
      decor.setSelectedDecorObject(object);
      router.push("/editor");
    } catch { toast.error("No se pudo preparar el objeto en este navegador."); }
  }

  async function toggleFavorite(id: string) {
    try { await decor.toggleFavorite(id); }
    catch { toast.error("No se pudo actualizar favoritos."); }
  }

  return <main id="contenido" className="min-h-screen bg-[#f4f0e7] px-4 py-9 sm:px-8 lg:px-10"><div className="mx-auto max-w-[1500px]"><header className="grid gap-5 lg:grid-cols-[1fr_minmax(360px,560px)] lg:items-end"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#667469]"><PackageOpen size={16} />Biblioteca decorativa</div><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#1f2421] sm:text-5xl">Objetos para imaginar tu próximo espacio</h1><p className="mt-3 max-w-2xl leading-7 text-[#687169]">Explora muebles y accesorios locales, guárdalos y déjalos listos para una futura colocación dentro del editor.</p></div><DecorObjectSearch value={query} onChange={setQuery} /></header><nav aria-label="Categorías de objetos" className="mt-7 flex gap-2 overflow-x-auto pb-2"><button type="button" onClick={() => setFilters((current) => ({ ...current, category: "" }))} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${!filters.category ? "border-[#202621] bg-[#202621] text-white" : "border-[#d5cec2] bg-white"}`}>Todos</button>{decorObjectCategories.map((category) => <button key={category} type="button" onClick={() => setFilters((current) => ({ ...current, category }))} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${filters.category === category ? "border-[#202621] bg-[#202621] text-white" : "border-[#d5cec2] bg-white"}`}>{decorCategoryLabels[category]}</button>)}</nav><RecentDecorObjects objects={decor.recentObjects} onOpen={decor.setSelectedDecorObject} /><DecorObjectFavorites objects={favoriteObjects} onOpen={decor.setSelectedDecorObject} /><div className="mt-9 flex items-center justify-between gap-4 border-y border-[#d8d1c5] py-4"><p className="text-sm text-[#687169]"><strong className="text-[#202621]">{results.length}</strong> objetos encontrados</p><button type="button" onClick={() => setMobileFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold lg:hidden"><Filter size={16} />Filtros</button></div><div className="mt-6 grid gap-6 lg:grid-cols-[245px_minmax(0,1fr)]"><div className="hidden lg:block"><div className="sticky top-20"><DecorObjectFilters filters={filters} colors={colors} onChange={setFilters} onClear={() => { setFilters(EMPTY_DECOR_FILTERS); setQuery(""); }} /></div></div><DecorObjectGrid objects={results} favorites={decor.favorites} onOpen={decor.setSelectedDecorObject} onFavorite={(id) => void toggleFavorite(id)} onUse={(object) => void prepareInEditor(object)} /></div></div>{mobileFilters ? <DecorObjectFilters mobile filters={filters} colors={colors} onChange={setFilters} onClear={() => { setFilters(EMPTY_DECOR_FILTERS); setQuery(""); }} onClose={() => setMobileFilters(false)} /> : null}{decor.selectedDecorObject ? <DecorObjectDetailDialog object={decor.selectedDecorObject} objects={decorObjects} favorite={decor.favorites.includes(decor.selectedDecorObject.id)} onClose={() => decor.setSelectedDecorObject(null)} onFavorite={() => void toggleFavorite(decor.selectedDecorObject!.id)} onUse={() => void prepareInEditor(decor.selectedDecorObject!)} onOpenSimilar={decor.setSelectedDecorObject} /> : null}<Toaster richColors position="top-right" /></main>;
}
