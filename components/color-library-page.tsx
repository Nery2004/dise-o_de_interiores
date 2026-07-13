"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Heart, PaintBucket, Plus, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { ColorCard } from "@/components/color-card";
import { interiorColors } from "@/data/interiorColors";
import { getRecommendedTextColor, hasGoodContrast } from "@/lib/colors/colorContrast";
import { hexToHsl, hexToRgb, hslToHex, normalizeHex, normalizeSearchText, rgbToHex } from "@/lib/colors/colorConversion";
import { getAnalogousColors, getComplementaryColor, getMonochromaticColors, getTriadicColors } from "@/lib/colors/colorHarmony";
import { addRecentColor, getCustomColors, getFavorites, saveCustomColor, setPendingEditorColor, toggleFavorite } from "@/lib/colors/colorPreferences";
import { createColorPalette, getColorPalettes, updateColorPalette, type ColorPaletteRecord } from "@/lib/palettes";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import type { ColorCategory, ColorMood, ColorUndertone, CustomInteriorColor, InteriorColor, RoomType } from "@/types/color";

type Luminosity = "" | "claros" | "medios" | "oscuros";
const categories: ColorCategory[] = ["blancos", "beige", "grises", "verdes", "azules", "terracotas", "rosados", "amarillos", "oscuros", "neutros"];
const undertones: ColorUndertone[] = ["calido", "frio", "neutro"];
const moods: ColorMood[] = ["acogedor", "elegante", "natural", "moderno", "relajante", "energico", "minimalista"];
const rooms: RoomType[] = ["sala", "dormitorio", "cocina", "baño", "comedor", "oficina", "pasillo", "infantil"];

function HarmonySwatches({ colors, onUse }: { colors: string[]; onUse: (hex: string) => void }) {
  async function addHarmonyColor(hex: string) {
    if (!isSupabaseConfigured) { toast.error("Supabase no está configurado."); return; }
    const response = await getColorPalettes();
    const available = response.error === null ? response.data : [];
    const name = window.prompt(available.length ? `Escribe una paleta existente (${available.map((palette) => palette.name).join(", ")}) o un nombre nuevo` : "Nombre de la nueva paleta", "Paleta armónica")?.trim();
    if (!name) return;
    const existing = available.find((palette) => normalizeSearchText(palette.name) === normalizeSearchText(name));
    if (existing) {
      if (existing.colors.some((color) => normalizeHex(color) === normalizeHex(hex))) { toast.error("Este color ya existe en la paleta."); return; }
      const updated = await updateColorPalette(existing.id, [...existing.colors, hex]);
      if (updated.error) toast.error(updated.message); else toast.success("Color agregado a la paleta.");
    } else {
      const created = await createColorPalette(name, [hex]);
      if (created.error) toast.error(created.message); else toast.success("Paleta creada.");
    }
  }
  return <div className="flex gap-2">{colors.map((hex) => <div key={hex} className="min-w-0 flex-1"><button type="button" title={`${hex} · usar en editor`} aria-label={`Usar color ${hex}`} onClick={() => onUse(hex)} className="h-12 w-full rounded-md border border-black/10 focus-visible:outline-2 focus-visible:outline-[#2563eb]" style={{ backgroundColor: hex }}><span className="sr-only">{hex}</span></button><div className="mt-1 flex justify-center gap-1"><button title="Copiar HEX" aria-label={`Copiar ${hex}`} onClick={async () => { await navigator.clipboard.writeText(hex); toast.success("Color copiado."); }} className="rounded border p-1"><Copy size={11} /></button><button title="Agregar a paleta" aria-label={`Agregar ${hex} a paleta`} onClick={() => void addHarmonyColor(hex)} className="rounded border p-1"><Plus size={11} /></button></div></div>)}</div>;
}

function ColorDetailDialog({ color, favorite, palettes, onClose, onFavorite, onUse }: { color: InteriorColor; favorite: boolean; palettes: ColorPaletteRecord[]; onClose: () => void; onFavorite: () => void; onUse: (hex: string, apply?: boolean) => void }) {
  const [paletteId, setPaletteId] = useState("");
  const harmonies = [{ label: "Complementario", colors: [getComplementaryColor(color.hex)] }, { label: "Análogos", colors: getAnalogousColors(color.hex) }, { label: "Tríada", colors: getTriadicColors(color.hex) }, { label: "Monocromáticos", colors: getMonochromaticColors(color.hex) }];
  async function addToPalette(hex = color.hex) {
    if (!isSupabaseConfigured) { toast.error("Supabase no está configurado."); return; }
    if (paletteId) {
      const palette = palettes.find((item) => item.id === paletteId);
      if (!palette) return;
      if (palette.colors.some((item) => normalizeHex(item) === normalizeHex(hex))) { toast.error("Este color ya existe en la paleta."); return; }
      const response = await updateColorPalette(palette.id, [...palette.colors, hex]);
      if (response.error) toast.error(response.message); else toast.success("Color agregado a la paleta.");
    } else {
      const name = window.prompt("Nombre de la nueva paleta", `Paleta ${color.name}`)?.trim();
      if (!name) return;
      const response = await createColorPalette(name, [hex]);
      if (response.error) toast.error(response.message); else toast.success("Paleta creada.");
    }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/50 p-4" role="dialog" aria-modal="true"><div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-[#7a8290]">Detalle del color</p><h2 className="mt-2 text-2xl font-semibold">{color.name}</h2></div><button onClick={onClose} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-full border"><X /></button></div><div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]"><div><div className="grid h-52 place-items-end rounded-xl p-4" style={{ backgroundColor: color.hex, color: getRecommendedTextColor(color.hex) }}><span className="rounded bg-black/15 px-3 py-2 font-mono backdrop-blur">{color.hex}</span></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={async () => { await navigator.clipboard.writeText(color.hex); toast.success("Color copiado."); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold"><Copy size={15} />Copiar HEX</button><button onClick={onFavorite} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold"><Heart size={15} fill={favorite ? "#dc2626" : "none"} />Favorito</button><button onClick={() => onUse(color.hex)} className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2421] text-sm font-semibold text-white"><PaintBucket size={15} />Usar en editor</button><button onClick={() => onUse(color.hex, true)} className="col-span-2 h-10 rounded-md border border-[#2563eb] text-sm font-semibold text-[#1d4ed8]">Aplicar a pared seleccionada</button></div></div><div><dl className="grid grid-cols-2 gap-3 rounded-lg bg-[#f7f8fa] p-4 text-sm"><div><dt className="text-[#7a8290]">RGB</dt><dd className="font-semibold">{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</dd></div><div><dt className="text-[#7a8290]">HSL</dt><dd className="font-semibold">{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</dd></div><div><dt className="text-[#7a8290]">Categoría</dt><dd className="capitalize font-semibold">{color.category}</dd></div><div><dt className="text-[#7a8290]">Subtono</dt><dd className="capitalize font-semibold">{color.undertone}</dd></div><div><dt className="text-[#7a8290]">Ambiente</dt><dd className="capitalize font-semibold">{color.mood}</dd></div><div><dt className="text-[#7a8290]">Contraste recomendado</dt><dd className="font-semibold">Texto {getRecommendedTextColor(color.hex) === "#000000" ? "negro" : "blanco"}</dd></div></dl><p className="mt-4 text-sm"><span className="font-semibold">Habitaciones:</span> {color.roomTypes.join(", ")}</p><div className="mt-3 flex flex-wrap gap-2">{color.tags.map((tag) => <span key={tag} className="rounded-full bg-[#eef1f4] px-2.5 py-1 text-xs">{tag}</span>)}</div><div className="mt-5 space-y-4">{harmonies.map((harmony) => <div key={harmony.label}><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7a8290]">{harmony.label}</p><HarmonySwatches colors={harmony.colors} onUse={onUse} /></div>)}</div><div className="mt-5 flex gap-2"><select value={paletteId} onChange={(event) => setPaletteId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border px-3 text-sm"><option value="">Crear paleta nueva</option>{palettes.map((palette) => <option key={palette.id} value={palette.id}>{palette.name}</option>)}</select><button onClick={() => void addToPalette()} className="h-10 rounded-md border px-3 text-sm font-semibold">Agregar a paleta</button></div></div></div></div></div>;
}

function CustomColorCreator({ onSaved, onUse }: { onSaved: (color: CustomInteriorColor) => void; onUse: (hex: string) => void }) {
  const [name, setName] = useState(""); const [hex, setHex] = useState("#A8B5A2");
  const normalized = normalizeHex(hex); const rgb = normalized ? hexToRgb(normalized) : null; const hsl = normalized ? hexToHsl(normalized) : null;
  function updateRgb(channel: "r" | "g" | "b", value: number) {
    if (!rgb) return;
    const next = rgbToHex(channel === "r" ? value : rgb.r, channel === "g" ? value : rgb.g, channel === "b" ? value : rgb.b);
    if (next) setHex(next);
  }
  function updateHsl(channel: "h" | "s" | "l", value: number) {
    if (!hsl) return;
    const next = hslToHex(channel === "h" ? value : hsl.h, channel === "s" ? value : hsl.s, channel === "l" ? value : hsl.l);
    if (next) setHex(next);
  }
  async function save() {
    if (!name.trim()) { toast.error("Escribe un nombre para el color."); return; }
    if (!normalized || !rgb || !hsl) { toast.error("El código HEX no es válido."); return; }
    const color: CustomInteriorColor = { id: `custom-${crypto.randomUUID()}`, name: name.trim(), hex: normalized, rgb, hsl, category: "neutros", undertone: "neutro", mood: "moderno", roomTypes: ["sala", "dormitorio"], tags: ["personalizado"], source: "custom", createdAt: new Date().toISOString() };
    await saveCustomColor(color); onSaved(color); toast.success("Color personalizado guardado.");
  }
  return <section className="rounded-xl border border-[#ded6c9] bg-white p-5"><h2 className="text-lg font-semibold">Color personalizado</h2><div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_1fr]"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del color" className="h-11 rounded-md border px-3" /><input aria-label="Código HEX personalizado" value={hex} onChange={(event) => setHex(event.target.value)} className="h-11 rounded-md border px-3 font-mono" /><div className="h-11 rounded-md border" style={{ backgroundColor: normalized ?? "transparent" }} /></div>{rgb && hsl ? <><div className="mt-4 grid grid-cols-3 gap-2">{(["r", "g", "b"] as const).map((channel) => <label key={channel} className="text-xs font-semibold uppercase text-[#7a8290]">RGB {channel}<input type="number" min="0" max="255" value={rgb[channel]} onChange={(event) => updateRgb(channel, Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border px-2 text-sm" /></label>)}</div><div className="mt-3 grid grid-cols-3 gap-2">{(["h", "s", "l"] as const).map((channel) => <label key={channel} className="text-xs font-semibold uppercase text-[#7a8290]">HSL {channel}<input type="number" min="0" max={channel === "h" ? 360 : 100} value={hsl[channel]} onChange={(event) => updateHsl(channel, Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border px-2 text-sm" /></label>)}</div></> : <p className="mt-3 text-sm text-[#b42318]">El código HEX no es válido.</p>}<div className="mt-4 flex gap-2"><button onClick={() => void save()} className="h-10 rounded-md border px-4 text-sm font-semibold">Guardar color</button><button disabled={!normalized} onClick={() => normalized && onUse(normalized)} className="h-10 rounded-md bg-[#1f2421] px-4 text-sm font-semibold text-white disabled:opacity-40">Usar en editor</button></div></section>;
}

export function ColorLibraryPage({ projectId }: { projectId?: string }) {
  const router = useRouter(); const [query, setQuery] = useState(""); const deferredQuery = useDeferredValue(query); const [category, setCategory] = useState<ColorCategory | "">(""); const [undertone, setUndertone] = useState<ColorUndertone | "">(""); const [mood, setMood] = useState<ColorMood | "">(""); const [room, setRoom] = useState<RoomType | "">(""); const [luminosity, setLuminosity] = useState<Luminosity>(""); const [favoritesOnly, setFavoritesOnly] = useState(false); const [favoriteIds, setFavoriteIds] = useState<string[]>([]); const [customColors, setCustomColors] = useState<CustomInteriorColor[]>([]); const [selected, setSelected] = useState<InteriorColor | null>(null); const [palettes, setPalettes] = useState<ColorPaletteRecord[]>([]); const [ruleColors, setRuleColors] = useState([interiorColors[6].hex, interiorColors[19].hex, interiorColors[33].hex]);
  useEffect(() => { const timer = window.setTimeout(() => { void getFavorites().then(setFavoriteIds); void getCustomColors().then(setCustomColors); if (isSupabaseConfigured) void getColorPalettes().then((response) => { if (response.error === null) setPalettes(response.data); }); }, 0); return () => clearTimeout(timer); }, []);
  const allColors = useMemo(() => [...interiorColors, ...customColors], [customColors]);
  const results = useMemo(() => allColors.filter((color) => {
    const haystack = normalizeSearchText([color.name, color.hex, color.category, color.mood, color.undertone, ...color.roomTypes, ...color.tags].join(" ")); const needle = normalizeSearchText(deferredQuery); const light = color.hsl.l >= 70 ? "claros" : color.hsl.l >= 40 ? "medios" : "oscuros";
    return (!needle || haystack.includes(needle)) && (!category || color.category === category) && (!undertone || color.undertone === undertone) && (!mood || color.mood === mood) && (!room || color.roomTypes.includes(room)) && (!luminosity || light === luminosity) && (!favoritesOnly || favoriteIds.includes(color.id));
  }), [allColors, category, deferredQuery, favoriteIds, favoritesOnly, luminosity, mood, room, undertone]);
  async function sendToEditor(hex: string, apply = false) { await setPendingEditorColor(hex, apply); await addRecentColor(hex); router.push(projectId ? `/editor?project=${encodeURIComponent(projectId)}` : "/editor"); }
  async function favorite(id: string) { const enabled = await toggleFavorite(id); setFavoriteIds((current) => enabled ? [...current, id] : current.filter((item) => item !== id)); }
  async function createFavoritesPalette() {
    const colors = allColors.filter((color) => favoriteIds.includes(color.id)).map((color) => color.hex);
    if (colors.length < 3) { toast.error("Selecciona al menos tres colores."); return; }
    const name = window.prompt("Nombre de la paleta", "Mis colores favoritos")?.trim();
    if (!name) return;
    const response = await createColorPalette(name, colors);
    if (response.error) toast.error(response.message); else toast.success("Paleta creada.");
  }
  const clearFilters = () => { setQuery(""); setCategory(""); setUndertone(""); setMood(""); setRoom(""); setLuminosity(""); setFavoritesOnly(false); };
  const combinations = [{ name: "Neutro moderno", ids: [57, 13, 52] }, { name: "Natural relajante", ids: [19, 7, 24, 0] }, { name: "Cálido acogedor", ids: [33, 40, 46] }, { name: "Elegante oscuro", ids: [52, 29, 3] }, { name: "Fresco costero", ids: [27, 20, 1, 8] }, { name: "Minimalista claro", ids: [2, 58, 12, 4, 60] }];
  return <main className="min-h-screen bg-[#f4f0e7] px-5 py-10 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#697469]">Biblioteca profesional</p><h1 className="mt-2 text-4xl font-semibold text-[#1f2421]">Colores para interiores</h1><p className="mt-3 max-w-2xl text-[#687169]">Explora tonos por ambiente, habitación y luminosidad; crea armonías y envía cualquier color al editor.</p></div>
    <section className="mt-8 rounded-xl border border-[#ded6c9] bg-white/80 p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, HEX, ambiente, habitación o etiqueta..." aria-label="Buscar colores" className="h-12 w-full rounded-md border px-4 outline-none focus:border-[#2563eb]" /><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">{[[category, setCategory, categories, "Categoría"], [undertone, setUndertone, undertones, "Subtono"], [mood, setMood, moods, "Ambiente"], [room, setRoom, rooms, "Habitación"], [luminosity, setLuminosity, ["claros", "medios", "oscuros"], "Luminosidad"]].map(([value, setter, options, label]) => <select key={String(label)} aria-label={`Filtrar por ${String(label).toLowerCase()}`} value={value as string} onChange={(event) => (setter as (value: never) => void)(event.target.value as never)} className="h-10 rounded-md border bg-white px-2 text-sm"><option value="">{String(label)}</option>{(options as string[]).map((option) => <option key={option} value={option}>{option}</option>)}</select>)}<label className="flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm"><input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />Favoritos</label></div><div className="mt-3 flex items-center justify-between"><p className="text-sm text-[#69717d]">{results.length} resultados</p><button onClick={clearFilters} className="text-sm font-semibold text-[#1d4ed8]">Limpiar filtros</button></div></section>
    {favoriteIds.length ? <section className="mt-8"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Favoritos</h2><button onClick={() => void createFavoritesPalette()} className="rounded-md border bg-white px-3 py-2 text-xs font-semibold">Crear paleta con favoritos</button></div><div className="mt-3 flex gap-2 overflow-auto pb-2">{allColors.filter((color) => favoriteIds.includes(color.id)).map((color) => <button key={color.id} onClick={() => setSelected(color)} className="h-16 w-24 shrink-0 rounded-md border" style={{ backgroundColor: color.hex }} aria-label={`Abrir favorito ${color.name}`} />)}</div></section> : null}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{results.map((color) => <ColorCard key={color.id} color={color} favorite={favoriteIds.includes(color.id)} onFavorite={() => void favorite(color.id)} onOpen={() => setSelected(color)} onUse={() => void sendToEditor(color.hex)} />)}</div>
    <section className="mt-12"><h2 className="text-2xl font-semibold">Combinaciones sugeridas</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{combinations.map((combination) => { const colors = combination.ids.map((id) => interiorColors[id % interiorColors.length]); return <article key={combination.name} className="rounded-xl border border-[#ded6c9] bg-white p-5"><h3 className="font-semibold">{combination.name}</h3><div className="mt-4 flex h-20 overflow-hidden rounded-lg">{colors.map((color) => <button key={color.id} onClick={() => void sendToEditor(color.hex)} className="flex-1" style={{ backgroundColor: color.hex }} title={color.name} />)}</div><p className="mt-4 text-sm leading-6 text-[#69717d]">Usa el color principal en la pared dominante, el secundario en paredes laterales y el acento en decoración.</p></article>; })}</div></section>
    <section className="mt-12 rounded-xl border border-[#ded6c9] bg-white p-6"><h2 className="text-2xl font-semibold">Regla 60-30-10</h2><p className="mt-2 text-sm text-[#69717d]">Selecciona un color principal, uno secundario y un acento.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{ruleColors.map((hex, index) => <select key={index} aria-label={`Color para proporción ${[60, 30, 10][index]}%`} value={hex} onChange={(event) => setRuleColors((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} className="h-11 rounded-md border px-3">{interiorColors.map((color) => <option key={color.id} value={color.hex}>{index === 0 ? "60%" : index === 1 ? "30%" : "10%"} · {color.name}</option>)}</select>)}</div><div className="mt-5 flex h-20 overflow-hidden rounded-lg">{ruleColors.map((hex, index) => <div key={index} style={{ backgroundColor: hex, width: `${[60, 30, 10][index]}%`, color: getRecommendedTextColor(hex) }} className="grid place-items-center font-semibold">{[60, 30, 10][index]}%</div>)}</div>{!hasGoodContrast(ruleColors[0], ruleColors[1]) ? <p className="mt-3 text-sm font-medium text-[#b45309]">Estos colores pueden verse demasiado similares.</p> : null}</section>
    <div className="mt-12"><CustomColorCreator onSaved={(color) => { setCustomColors((current) => [...current, color]); setSelected(color); }} onUse={(hex) => void sendToEditor(hex)} /></div>
    </div>{selected ? <ColorDetailDialog color={selected} favorite={favoriteIds.includes(selected.id)} palettes={palettes} onClose={() => setSelected(null)} onFavorite={() => void favorite(selected.id)} onUse={(hex, apply) => void sendToEditor(hex, apply)} /> : null}<Toaster richColors position="top-right" /></main>;
}
