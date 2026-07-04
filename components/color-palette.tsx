"use client";

import { useState } from "react";
import { PaintBucket } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { blendModeOptions, interiorColorPalette } from "@/lib/editor-data";
import { cn, normalizeHexColor } from "@/lib/utils";
import type { BlendMode } from "@/types/editor";

export function ColorPalette() {
  const {
    activeColor,
    applyColorToSelectedMask,
    globalBlendMode,
    selectedMaskId,
    setActiveColor,
    setGlobalBlendMode,
  } = useEditor();
  const [hexInput, setHexInput] = useState(activeColor ?? "#A8B5A2");
  const selectedColor = normalizeHexColor(hexInput) ?? activeColor ?? "#A8B5A2";

  function chooseColor(color: string) {
    const normalizedColor = normalizeHexColor(color);

    if (!normalizedColor) {
      return;
    }

    setHexInput(normalizedColor);
    setActiveColor(normalizedColor);
  }

  function applyColor() {
    const normalizedColor = normalizeHexColor(hexInput);

    if (!normalizedColor) {
      toast.error("Escribe un codigo HEX valido.");
      return;
    }

    if (!selectedMaskId) {
      toast.error("Selecciona una pared antes de aplicar color.");
      return;
    }

    applyColorToSelectedMask(normalizedColor);
  }

  return (
    <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
        Paleta de colores
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {interiorColorPalette.map((color) => {
          const isActive = activeColor === color.hex;

          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => chooseColor(color.hex)}
              className={cn(
                "rounded-md border bg-white p-2 text-left transition hover:border-[#c9d1dc]",
                isActive
                  ? "border-[#202124] ring-2 ring-[#202124]/10"
                  : "border-[#edf0f3]",
              )}
            >
              <span
                className="block h-8 rounded border border-black/10"
                style={{ backgroundColor: color.hex }}
              />
              <span className="mt-2 block truncate text-[11px] font-semibold text-[#30343b]">
                {color.name}
              </span>
              <span className="mt-1 block font-mono text-[10px] text-[#7a8290]">
                {color.hex}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-[44px_1fr] gap-2">
        <input
          type="color"
          value={selectedColor}
          onChange={(event) => chooseColor(event.target.value)}
          className="h-10 w-11 cursor-pointer rounded-md border border-[#dfe3e8] bg-white p-1"
        />
        <input
          value={hexInput}
          onChange={(event) => {
            setHexInput(event.target.value);

            const color = normalizeHexColor(event.target.value);
            if (color) {
              setActiveColor(color);
            }
          }}
          placeholder="#A8B5A2"
          className="h-10 rounded-md border border-[#dfe3e8] bg-white px-3 font-mono text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
        />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Modo de mezcla
        </span>
        <select
          value={globalBlendMode}
          onChange={(event) =>
            setGlobalBlendMode(event.target.value as BlendMode)
          }
          className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
        >
          {blendModeOptions.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={applyColor}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] px-3 text-sm font-semibold text-white transition hover:bg-[#343b36]"
      >
        <PaintBucket size={16} />
        Aplicar a pared seleccionada
      </button>
    </section>
  );
}
