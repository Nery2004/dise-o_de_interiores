"use client";

import { Armchair, ExternalLink, Heart, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDecorObjects } from "@/components/use-decor-objects";
import { DecorObjectPreview } from "@/components/decor/decor-object-preview";
import { useProject } from "@/components/project-context";
import { useEditor } from "@/components/editor-context";
import { ObjectPropertiesPanel } from "@/components/decor/object-properties-panel";
import { useComparison } from "@/components/comparison-context";
import { SurfacePanel } from "@/components/perspective/surface-panel";
import { ObjectPerspectiveProperties } from "@/components/perspective/object-perspective-properties";
import { ObjectLightingPanel } from "@/components/decor/object-lighting-panel";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { LayerManager } from "@/components/decor/layer-manager";
import { ProfessionalObjectInspector } from "@/components/decor/professional-object-inspector";
import { ObjectStatisticsPanel } from "@/components/decor/object-statistics-panel";
import { decorObjects } from "@/data/decorObjects";
import { matchesDecorSearch } from "@/lib/decor/filterDecorObjects";
import {
  premiumDecorCategoryLabels,
  premiumDecorCategories,
  type DecorObject,
  type PremiumDecorCategory,
} from "@/types/decor-object";
import { FeatureFlags } from "@/config/featureFlags";

function MiniObject({
  object,
  onPrepare,
}: {
  object: DecorObject;
  onPrepare: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPrepare}
      aria-label={`Preparar ${object.name}`}
      className="w-24 shrink-0 rounded-lg border border-[#dfe3e8] bg-white p-1.5 text-left hover:border-[#8fa087]"
    >
      <span className="block aspect-square rounded-md bg-[#f2eee7]">
        <DecorObjectPreview
          object={object}
          sizes="96px"
          className="h-full w-full"
        />
      </span>
      <span className="mt-1.5 block truncate text-[11px] font-semibold">
        {object.name}
      </span>
    </button>
  );
}

export function EditorObjectsPanel() {
  const decor = useDecorObjects();
  const project = useProject();
  const editor = useEditor();
  const comparison = useComparison();
  const placement = useDecorPlacement();
  const selectedObject = placement.placedObjects.find((item) => item.id === placement.selectedObjectId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PremiumDecorCategory | "">("");
  const favoriteSet = useMemo(
    () => new Set(decor.favorites),
    [decor.favorites],
  );
  const favorites = useMemo(
    () => decorObjects.filter((object) => favoriteSet.has(object.id)),
    [favoriteSet],
  );
  const results = useMemo(
    () =>
      decorObjects
        .filter(
          (object) =>
            (!category || object.catalogCategory === category) &&
            matchesDecorSearch(object, query),
        )
        .slice(0, 8),
    [category, query],
  );

  async function prepare(object: DecorObject) {
    try {
      const selected = await decor.setPendingDecorObject(object);
      if (!selected) {
        toast.error("Este objeto tiene dimensiones inválidas.");
        return;
      }
      decor.setSelectedDecorObject(object);
      comparison.setMode("edited");
      toast.success("Objeto listo para colocar.");
    } catch {
      toast.error("No se pudo preparar el objeto.");
    }
  }

  return (
    <section
      className="fixed inset-x-3 bottom-3 z-40 max-h-[78dvh] overflow-auto rounded-2xl border border-[#d7dce3] bg-[#fafbfc] p-4 shadow-2xl lg:static lg:max-h-none lg:rounded-md lg:shadow-none"
      aria-label="Panel de objetos decorativos"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
            Objetos
          </p>
          <h2 className="mt-1 text-base font-semibold">
            Biblioteca decorativa
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Armchair size={20} className="text-[#5b665d]" />
          <button
            type="button"
            onClick={() => {
              if (decor.pendingDecorObject)
                void decor.clearPendingDecorObject();
              editor.setActiveTool("select");
            }}
            aria-label="Cerrar panel de objetos"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {decor.pendingDecorObject ? (
        <div className="mt-4 rounded-xl border border-[#b9c7b1] bg-[#eef3eb] p-3">
          <div className="flex gap-3">
            <span className="h-16 w-16 shrink-0 rounded-lg bg-white">
              <DecorObjectPreview
                object={decor.pendingDecorObject}
                sizes="64px"
                className="h-full w-full"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#50634f]">
                Objeto listo para colocar
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {decor.pendingDecorObject.name}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-[#667067]">
                Haz clic sobre la habitación para colocar el objeto.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void decor.clearPendingDecorObject()}
              aria-label="Cancelar colocación"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-[#cbd2da] bg-white p-3 text-xs leading-5 text-[#69717d]">
          Escoge un objeto y después haz clic sobre la habitación para
          colocarlo.
        </p>
      )}
      <label className="relative mt-4 block">
        <span className="sr-only">Buscar objetos en el editor</span>
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8290]"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar objetos..."
          className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-[#50634f]"
        />
      </label>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${!category ? "bg-[#202621] text-white" : "border bg-white"}`}
        >
          Todos
        </button>
        {premiumDecorCategories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${category === item ? "bg-[#202621] text-white" : "border bg-white"}`}
          >
            {premiumDecorCategoryLabels[item]}
          </button>
        ))}
      </div>
      {decor.recentObjects.length ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-[#5f6670]">Recientes</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {decor.recentObjects.slice(0, 6).map((object) => (
              <MiniObject
                key={object.id}
                object={object}
                onPrepare={() => void prepare(object)}
              />
            ))}
          </div>
        </div>
      ) : null}
      {favorites.length ? (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#5f6670]">
            <Heart size={13} />
            Favoritos
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {favorites.slice(0, 6).map((object) => (
              <MiniObject
                key={object.id}
                object={object}
                onPrepare={() => void prepare(object)}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {results.map((object) => (
          <button
            key={object.id}
            type="button"
            onClick={() => void prepare(object)}
            className="rounded-lg border bg-white p-2 text-left hover:border-[#8fa087]"
          >
            <span className="block aspect-square rounded-md bg-[#f2eee7]">
              <DecorObjectPreview
                object={object}
                sizes="110px"
                className="h-full w-full"
              />
            </span>
            <span className="mt-1.5 block truncate text-[11px] font-semibold">
              {object.name}
            </span>
          </button>
        ))}
      </div>
      {FeatureFlags.advancedPerspective ? <SurfacePanel /> : null}
      <ObjectPropertiesPanel />
      {selectedObject ? <ObjectLightingPanel object={selectedObject} /> : null}
      {FeatureFlags.advancedPerspective ? <ObjectPerspectiveProperties /> : null}
      <ProfessionalObjectInspector />
      <LayerManager />
      <ObjectStatisticsPanel />
      <button
        type="button"
        onClick={() => project.navigateWithGuard("/objects")}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#cfd5dc] bg-white text-xs font-semibold hover:bg-[#f3f4f5]"
      >
        <ExternalLink size={14} />
        Explorar biblioteca completa
      </button>
    </section>
  );
}
