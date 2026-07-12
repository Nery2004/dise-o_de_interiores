"use client";

import { RotateCcw, X } from "lucide-react";
import { decorObjectCategories, decorObjectStyles, decorRoomTypes, decorCategoryLabels, decorRoomLabels, decorStyleLabels } from "@/types/decor-object";
import type { DecorObjectFiltersState } from "@/lib/decor/filterDecorObjects";

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.13em] text-[#6d756e]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-[#ddd6ca] bg-white px-3 text-sm text-[#303630] outline-none focus:border-[#50634f]"><option value="">Todos</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export function DecorObjectFilters({ filters, colors, onChange, onClear, mobile = false, onClose }: { filters: DecorObjectFiltersState; colors: string[]; onChange: (filters: DecorObjectFiltersState) => void; onClear: () => void; mobile?: boolean; onClose?: () => void }) {
  const content = <div className="space-y-4">
    <SelectField label="Categoría" value={filters.category} onChange={(category) => onChange({ ...filters, category: category as DecorObjectFiltersState["category"] })} options={decorObjectCategories.map((value) => ({ value, label: decorCategoryLabels[value] }))} />
    <SelectField label="Estilo" value={filters.style} onChange={(style) => onChange({ ...filters, style: style as DecorObjectFiltersState["style"] })} options={decorObjectStyles.map((value) => ({ value, label: decorStyleLabels[value] }))} />
    <SelectField label="Habitación" value={filters.room} onChange={(room) => onChange({ ...filters, room: room as DecorObjectFiltersState["room"] })} options={decorRoomTypes.map((value) => ({ value, label: decorRoomLabels[value] }))} />
    <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.13em] text-[#6d756e]">Color dominante</span><select value={filters.dominantColor} onChange={(event) => onChange({ ...filters, dominantColor: event.target.value })} className="h-10 w-full rounded-lg border border-[#ddd6ca] bg-white px-3 text-sm outline-none"><option value="">Todos</option>{colors.map((color) => <option key={color} value={color}>{color}</option>)}</select><span className="mt-2 flex flex-wrap gap-1.5">{colors.slice(0, 12).map((color) => <button key={color} type="button" aria-label={`Filtrar por color ${color}`} title={color} onClick={() => onChange({ ...filters, dominantColor: filters.dominantColor === color ? "" : color })} className={`h-6 w-6 rounded-full border border-black/15 ${filters.dominantColor === color ? "ring-2 ring-[#50634f] ring-offset-2" : ""}`} style={{ backgroundColor: color }} />)}</span></label>
    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#ddd6ca] bg-white px-3 text-sm font-semibold"><input type="checkbox" checked={filters.favoritesOnly} onChange={(event) => onChange({ ...filters, favoritesOnly: event.target.checked })} className="h-4 w-4 accent-[#50634f]" />Solo favoritos</label>
    <button type="button" onClick={onClear} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#cfc8bc] bg-white text-sm font-semibold text-[#434a44] hover:bg-[#f4f1eb]"><RotateCcw size={15} />Limpiar filtros</button>
  </div>;
  if (!mobile) return <aside aria-label="Filtros de objetos" className="rounded-2xl border border-[#ddd6ca] bg-white/80 p-5 shadow-sm"><h2 className="mb-5 font-semibold text-[#202621]">Filtrar biblioteca</h2>{content}</aside>;
  return <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros de objetos"><div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-auto rounded-t-3xl bg-[#fbfaf7] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Filtros</h2><button type="button" onClick={onClose} aria-label="Cerrar filtros" className="grid h-10 w-10 place-items-center rounded-full border bg-white"><X size={18} /></button></div>{content}</div></div>;
}
