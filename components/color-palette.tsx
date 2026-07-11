"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaintBucket } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { useProject } from "@/components/project-context";
import { SavedPalettesPanel } from "@/components/saved-palettes-panel";
import { interiorColors } from "@/data/interiorColors";
import { getCustomColors, getFavorites, getRecentColors } from "@/lib/colors/colorPreferences";
import { normalizeSearchText } from "@/lib/colors/colorConversion";
import { blendModeOptions } from "@/lib/editor-data";
import { cn, normalizeHexColor } from "@/lib/utils";
import type { BlendMode } from "@/types/editor";
import type { CustomInteriorColor } from "@/types/color";

type Tab = "recommended" | "library" | "favorites" | "palettes" | "custom";
const tabs: Array<{ id: Tab; label: string }> = [{ id: "recommended", label: "Recomendados" }, { id: "library", label: "Biblioteca" }, { id: "favorites", label: "Favoritos" }, { id: "palettes", label: "Paletas guardadas" }, { id: "custom", label: "Personalizado" }];

export function ColorPalette() {
  const editor = useEditor();
  const project = useProject();
  const [tab, setTab] = useState<Tab>("recommended");
  const [query, setQuery] = useState("");
  const [hexInput, setHexInput] = useState(editor.activeColor ?? "#A8B5A2");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<CustomInteriorColor[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => { void getFavorites().then(setFavoriteIds); void getCustomColors().then(setCustomColors); void getRecentColors().then(setRecent); }, 0); return () => clearTimeout(timer); }, [tab, editor.activeColor]);
  const allColors = useMemo(() => [...interiorColors, ...customColors], [customColors]);
  const visible = tab === "recommended" ? interiorColors.slice(0, 12) : tab === "library" ? allColors.filter((color) => normalizeSearchText(`${color.name} ${color.hex} ${color.category}`).includes(normalizeSearchText(query))).slice(0, 30) : tab === "favorites" ? allColors.filter((color) => favoriteIds.includes(color.id)) : [];
  const selectedColor = normalizeHexColor(hexInput) ?? editor.activeColor ?? "#A8B5A2";

  function chooseColor(color: string) {
    const normalized = normalizeHexColor(color);
    if (!normalized) return;
    setHexInput(normalized);
    editor.setActiveColor(normalized);
  }
  function applyColor() {
    const normalized = normalizeHexColor(hexInput);
    if (!normalized) { toast.error("El código HEX no es válido."); return; }
    if (!editor.selectedMaskId) { toast.error("Selecciona una pared antes de aplicar color."); return; }
    editor.applyColorToSelectedMask(normalized);
  }

  return <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">Paleta de colores</p><div className="mt-3 flex gap-1 overflow-x-auto pb-1">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn("shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold", tab === item.id ? "border-[#1f2421] bg-[#1f2421] text-white" : "border-[#dfe3e8] bg-white text-[#5f6875]")}>{item.label}</button>)}</div>
    {tab === "palettes" ? <SavedPalettesPanel /> : <>
      {tab === "library" ? <><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar colores..." className="mt-4 h-10 w-full rounded-md border px-3 text-sm" /><Link href={project.activeProjectId ? `/colors?project=${project.activeProjectId}` : "/colors"} className="mt-2 block text-right text-xs font-semibold text-[#1d4ed8]">Abrir biblioteca completa</Link></> : null}
      {tab === "custom" ? <div className="mt-4 grid grid-cols-[44px_1fr] gap-2"><input type="color" value={selectedColor} onChange={(event) => chooseColor(event.target.value)} className="h-10 w-11 rounded-md border p-1" /><input value={hexInput} onChange={(event) => { setHexInput(event.target.value); const color = normalizeHexColor(event.target.value); if (color) editor.setActiveColor(color); }} placeholder="#A8B5A2" className="h-10 rounded-md border px-3 font-mono text-sm" /></div> : null}
      {tab === "favorites" && visible.length === 0 ? <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-[#7a8290]">Aún no hay colores favoritos.</p> : null}
      {tab !== "custom" ? <div className="mt-4 grid max-h-72 grid-cols-3 gap-2 overflow-auto pr-1">{visible.map((color) => <button key={color.id} onClick={() => chooseColor(color.hex)} title={color.name} aria-label={`Seleccionar ${color.name}`} className={cn("rounded-md border bg-white p-1.5 text-left focus-visible:outline-2 focus-visible:outline-[#2563eb]", editor.activeColor === color.hex ? "border-[#202124] ring-2 ring-black/10" : "border-[#edf0f3]")}><span className="block h-8 rounded" style={{ backgroundColor: color.hex }} /><span className="mt-1 block truncate text-[10px] font-semibold">{color.name}</span></button>)}</div> : null}
      {recent.length ? <div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a8290]">Usados recientemente</p><div className="mt-2 flex flex-wrap gap-1.5">{recent.map((hex) => <button key={hex} onClick={() => chooseColor(hex)} title={hex} aria-label={`Seleccionar color reciente ${hex}`} className="h-7 w-7 rounded border border-black/10" style={{ backgroundColor: hex }} />)}</div></div> : null}
      <label className="mt-4 block"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8290]">Modo de mezcla</span><select value={editor.globalBlendMode} onChange={(event) => editor.setGlobalBlendMode(event.target.value as BlendMode)} className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm">{blendModeOptions.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label><button onClick={applyColor} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2421] text-sm font-semibold text-white"><PaintBucket size={16} />Aplicar a pared seleccionada</button>
    </>}</section>;
}
