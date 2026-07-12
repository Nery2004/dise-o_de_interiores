"use client";

import { useState } from "react";
import { useEditor } from "@/components/editor-context";
import { normalizeHexColor } from "@/lib/utils";
import type { WallMask } from "@/types/editor";

type MaskControlFormProps = {
  removeColorFromMask: (id: string) => void;
  selectedMask: WallMask;
  setActiveColor: (color: string | null) => void;
  updateMask: (id: string, data: Partial<WallMask>) => void;
};

function MaskControlForm({
  removeColorFromMask,
  selectedMask,
  setActiveColor,
  updateMask,
}: MaskControlFormProps) {
  const [maskColorInput, setMaskColorInput] = useState(
    selectedMask.color ?? "",
  );

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Nombre
        </span>
        <input
          value={selectedMask.name}
          onChange={(event) =>
            updateMask(selectedMask.id, { name: event.target.value })
          }
          className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
        />
      </label>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">
          Color actual
        </p>
        <div className="mt-3 grid grid-cols-[44px_1fr] gap-2">
          <input
            type="color"
            value={normalizeHexColor(maskColorInput) ?? "#A8B5A2"}
            onChange={(event) => {
              const color = normalizeHexColor(event.target.value);

              if (color) {
                setMaskColorInput(color);
                setActiveColor(color);
                updateMask(selectedMask.id, { color });
              }
            }}
            className="h-10 w-11 cursor-pointer rounded-md border border-[#dfe3e8] bg-white p-1"
          />
          <input
            value={maskColorInput}
            placeholder="#A8B5A2"
            onChange={(event) => {
              const color = normalizeHexColor(event.target.value);
              setMaskColorInput(event.target.value);

              if (color) {
                setActiveColor(color);
                updateMask(selectedMask.id, { color });
              }
            }}
            onBlur={(event) => {
              const color = normalizeHexColor(event.target.value);

              if (!color && event.target.value) {
                setMaskColorInput(selectedMask.color ?? "");
              }
            }}
            className="h-10 rounded-md border border-[#dfe3e8] bg-white px-3 font-mono text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => removeColorFromMask(selectedMask.id)}
        className="h-10 w-full rounded-md border border-[#f0c7c2] bg-white text-sm font-semibold text-[#b42318] transition hover:bg-[#fff5f5]"
      >
        Quitar color de esta pared
      </button>
    </div>
  );
}

export function MaskControls() {
  const {
    masks,
    removeColorFromMask,
    selectedMaskId,
    setActiveColor,
    updateMask,
  } = useEditor();
  const selectedMask = masks.find((mask) => mask.id === selectedMaskId);

  if (!selectedMask) {
    return (
      <div className="rounded-md border border-dashed border-[#d5dbe3] bg-white px-3 py-5 text-center text-sm text-[#7b8490]">
        Selecciona una pared para editar sus propiedades.
      </div>
    );
  }

  return (
    <MaskControlForm
      key={`${selectedMask.id}-${selectedMask.color ?? "none"}`}
      removeColorFromMask={removeColorFromMask}
      selectedMask={selectedMask}
      setActiveColor={setActiveColor}
      updateMask={updateMask}
    />
  );
}
