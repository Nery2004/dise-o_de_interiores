"use client";

import { Search, X } from "lucide-react";

export function DecorObjectSearch({ value, onChange, compact = false }: { value: string; onChange: (value: string) => void; compact?: boolean }) {
  return <label className="relative block">
    <span className="sr-only">Buscar objetos decorativos</span>
    <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a817b]" />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={compact ? "Buscar objetos..." : "Buscar por nombre, categoría, estilo, color o habitación..."} className={`${compact ? "h-10" : "h-12"} w-full rounded-xl border border-[#d9d2c6] bg-white pl-10 pr-10 text-sm outline-none transition focus:border-[#50634f] focus:ring-3 focus:ring-[#8fa087]/20`} />
    {value ? <button type="button" onClick={() => onChange("")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#697169] hover:bg-[#f1eee8]"><X size={15} /></button> : null}
  </label>;
}
