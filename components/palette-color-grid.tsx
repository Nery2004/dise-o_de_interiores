"use client";

import { cn } from "@/lib/utils";

type PaletteColorGridProps = {
  colors: string[];
  activeColor: string | null;
  onSelectColor: (color: string) => void;
};

export function PaletteColorGrid({
  activeColor,
  colors,
  onSelectColor,
}: PaletteColorGridProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Seleccionar color ${color}`}
          onClick={() => onSelectColor(color)}
          className={cn(
            "h-8 rounded-md border transition hover:scale-[1.04]",
            activeColor === color
              ? "border-[#202124] ring-2 ring-[#202124]/10"
              : "border-black/10",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
