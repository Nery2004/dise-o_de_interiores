"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { PaletteColorGrid } from "@/components/palette-color-grid";
import { PaletteForm } from "@/components/palette-form";
import { interiorColorPalette } from "@/lib/editor-data";
import {
  createColorPalette,
  deleteColorPalette,
  getColorPalettes,
  type ColorPaletteRecord,
} from "@/lib/palettes";
import {
  isSupabaseConfigured,
  supabaseNotConfiguredMessage,
} from "@/lib/supabaseClient";
import { normalizeHexColor } from "@/lib/utils";

function uniqueColors(colors: string[]) {
  return Array.from(
    new Set(
      colors
        .map(normalizeHexColor)
        .filter((color): color is string => color !== null),
    ),
  );
}

export function SavedPalettesPanel() {
  const { activeColor, masks, setActiveColor } = useEditor();
  const [paletteName, setPaletteName] = useState("");
  const [palettes, setPalettes] = useState<ColorPaletteRecord[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const seedColors = uniqueColors([
    ...interiorColorPalette.map((color) => color.hex),
    ...masks.map((mask) => mask.color ?? ""),
    activeColor ?? "",
  ]);

  function loadPalettes() {
    if (!isSupabaseConfigured) {
      return;
    }

    startTransition(() => {
      void getColorPalettes().then((response) => {
        setHasLoaded(true);

        if (response.error !== null) {
          toast.error(response.message);
          return;
        }

        setPalettes(response.data);
      });
    });
  }

  function savePalette() {
    const name = paletteName.trim();

    if (!name) {
      toast.error("Escribe un nombre para la paleta.");
      return;
    }

    if (seedColors.length === 0) {
      toast.error("La paleta debe tener al menos un color.");
      return;
    }

    startTransition(() => {
      void createColorPalette(name, seedColors).then((response) => {
        if (response.error !== null) {
          toast.error(response.message);
          return;
        }

        setPalettes((current) => [response.data, ...current]);
        setPaletteName("");
        setHasLoaded(true);
        toast.success("Paleta guardada.");
      });
    });
  }

  function removePalette(id: string) {
    startTransition(() => {
      void deleteColorPalette(id).then((response) => {
        if (response.error !== null) {
          toast.error(response.message);
          return;
        }

        setPalettes((current) =>
          current.filter((palette) => palette.id !== id),
        );
        toast.success("Paleta eliminada.");
      });
    });
  }

  return (
    <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
            Nube
          </p>
          <h2 className="mt-2 text-base font-semibold text-[#202124]">
            Paletas guardadas
          </h2>
        </div>
        <button
          type="button"
          onClick={loadPalettes}
          disabled={!isSupabaseConfigured || isPending}
          className="rounded-md border border-[#dfe3e8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4b5563] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Cargar
        </button>
      </div>

      {!isSupabaseConfigured ? (
        <p className="mt-4 rounded-md border border-[#f1d2a8] bg-[#fff7ed] px-3 py-2 text-xs leading-5 text-[#8a5a1f]">
          {supabaseNotConfiguredMessage}
        </p>
      ) : null}

      <div className="mt-4">
        <PaletteForm
          activeColor={activeColor}
          colors={seedColors}
          disabled={!isSupabaseConfigured}
          name={paletteName}
          saving={isPending}
          onNameChange={setPaletteName}
          onSave={savePalette}
          onSelectColor={setActiveColor}
        />
      </div>

      <div className="mt-4 space-y-3">
        {palettes.map((palette) => (
          <article
            key={palette.id}
            className="rounded-md border border-[#edf0f3] bg-white p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-[#202124]">
                {palette.name}
              </p>
              <button
                type="button"
                aria-label="Eliminar paleta"
                onClick={() => removePalette(palette.id)}
                disabled={isPending}
                className="grid h-8 w-8 shrink-0 place-items-center rounded text-[#b42318] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <PaletteColorGrid
              activeColor={activeColor}
              colors={palette.colors}
              onSelectColor={setActiveColor}
            />
          </article>
        ))}

        {isSupabaseConfigured && hasLoaded && palettes.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#d5dbe3] bg-white px-3 py-5 text-center text-sm text-[#7b8490]">
            No hay paletas guardadas.
          </p>
        ) : null}
      </div>
    </section>
  );
}
