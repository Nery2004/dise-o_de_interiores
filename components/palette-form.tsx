"use client";

import { Save } from "lucide-react";
import { PaletteColorGrid } from "@/components/palette-color-grid";

type PaletteFormProps = {
  activeColor: string | null;
  colors: string[];
  disabled: boolean;
  name: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onSelectColor: (color: string) => void;
};

export function PaletteForm({
  activeColor,
  colors,
  disabled,
  name,
  onNameChange,
  onSave,
  onSelectColor,
  saving,
}: PaletteFormProps) {
  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Nombre de la paleta"
        className="h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm text-[#202124] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 disabled:cursor-not-allowed disabled:bg-[#f3f4f6]"
        disabled={disabled}
      />
      <PaletteColorGrid
        activeColor={activeColor}
        colors={colors}
        onSelectColor={onSelectColor}
      />
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || saving}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] px-3 text-sm font-semibold text-white transition hover:bg-[#343b36] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Save size={16} />
        {saving ? "Guardando..." : "Guardar paleta"}
      </button>
    </div>
  );
}
