export type ColorCategory = "blancos" | "beige" | "grises" | "verdes" | "azules" | "terracotas" | "rosados" | "amarillos" | "oscuros" | "neutros";
export type ColorUndertone = "calido" | "frio" | "neutro";
export type ColorMood = "acogedor" | "elegante" | "natural" | "moderno" | "relajante" | "energico" | "minimalista";
export type RoomType = "sala" | "dormitorio" | "cocina" | "baño" | "comedor" | "oficina" | "pasillo" | "infantil";

export type InteriorColor = {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  category: ColorCategory;
  undertone: ColorUndertone;
  mood: ColorMood;
  roomTypes: RoomType[];
  tags: string[];
  isFavorite?: boolean;
};

export type CustomInteriorColor = InteriorColor & {
  source: "custom";
  createdAt: string;
};
