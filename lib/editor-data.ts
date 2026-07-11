import type {
  BlendMode,
  EditorStage,
  EditorTool,
  MoodBoard,
  WallColorSwatch,
} from "@/types/editor";

export const wallColorSwatches: WallColorSwatch[] = [
  { name: "Soft Clay", hex: "#b98773" },
  { name: "Olive Mist", hex: "#9ba98f" },
  { name: "Warm Plaster", hex: "#d8cbb8" },
  { name: "Deep Charcoal", hex: "#343b36" },
  { name: "Powder Blue", hex: "#aab9bd" },
  { name: "Muted Rose", hex: "#c9a39a" },
];

export const editorStages: EditorStage[] = [
  {
    id: "upload",
    label: "Photo upload",
    status: "Ready",
    description: "Base route and input surface are in place.",
  },
  {
    id: "selection",
    label: "Wall selection",
    status: "Next",
    description: "Prepared for manual or assisted masks.",
  },
  {
    id: "render",
    label: "Color render",
    status: "Next",
    description: "Reserved for realistic texture and light preservation.",
  },
];

export const moodBoards: MoodBoard[] = [
  {
    name: "Calm Atelier",
    description: "Soft plaster, sage, charcoal, and warm wood for quiet rooms.",
    colors: ["#d8cbb8", "#9ba98f", "#343b36", "#8b6f58"],
  },
  {
    name: "Sunlit Terracotta",
    description: "Clay walls, ivory linen, walnut, and muted rose accents.",
    colors: ["#b98773", "#f0eadf", "#765640", "#c9a39a"],
  },
  {
    name: "Gallery Neutral",
    description: "Balanced whites, stone grey, ink details, and powder blue.",
    colors: ["#eee9df", "#b8b4aa", "#202621", "#aab9bd"],
  },
];

export const editorTools: Array<{
  id: EditorTool;
  label: string;
  shortcut: string;
}> = [
  { id: "select", label: "Seleccionar", shortcut: "V" },
  { id: "manual-select", label: "Seleccion manual", shortcut: "P" },
  { id: "edit-mask", label: "Editar máscara", shortcut: "M" },
  { id: "add-to-mask", label: "Añadir a máscara", shortcut: "+" },
  { id: "remove-from-mask", label: "Quitar de máscara", shortcut: "-" },
  { id: "paint-wall", label: "Pintar pared", shortcut: "B" },
  { id: "eraser", label: "Borrador", shortcut: "E" },
  { id: "zoom", label: "Zoom", shortcut: "Z" },
  { id: "pan", label: "Mano", shortcut: "H" },
  { id: "compare", label: "Comparar Antes / Despues", shortcut: "C" },
];

export const maskColorSwatches = [
  "#b98773",
  "#9ba98f",
  "#d8cbb8",
  "#aab9bd",
  "#c9a39a",
  "#343b36",
] as const;

export const interiorColorPalette = [
  { name: "Blanco calido", hex: "#F5F1E8" },
  { name: "Beige arena", hex: "#D8C3A5" },
  { name: "Gris perla", hex: "#D9D9D9" },
  { name: "Verde salvia", hex: "#A8B5A2" },
  { name: "Azul niebla", hex: "#A7BED3" },
  { name: "Terracota suave", hex: "#C98276" },
  { name: "Oliva claro", hex: "#B7B597" },
  { name: "Grafito", hex: "#4A4A4A" },
] as const;

export const blendModeOptions: Array<{ label: string; value: BlendMode }> = [
  { label: "Normal", value: "normal" },
  { label: "Multiply", value: "multiply" },
  { label: "Color", value: "color" },
  { label: "Overlay", value: "overlay" },
];
