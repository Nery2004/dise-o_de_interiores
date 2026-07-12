export const decorObjectCategories = [
  "sillones", "sillas", "mesas", "macetas", "plantas", "lamparas",
  "alfombras", "cuadros", "estanterias", "decoracion", "camas", "escritorios",
] as const;

export const decorObjectStyles = [
  "moderno", "minimalista", "clasico", "industrial", "nordico", "rustico",
  "bohemio", "contemporaneo",
] as const;

export const decorRoomTypes = [
  "sala", "dormitorio", "comedor", "oficina", "pasillo", "terraza", "cocina",
] as const;

export type DecorObjectCategory = typeof decorObjectCategories[number];
export type DecorObjectStyle = typeof decorObjectStyles[number];
export type DecorRoomType = typeof decorRoomTypes[number];

export type DecorObject = {
  id: string;
  name: string;
  category: DecorObjectCategory;
  style: DecorObjectStyle;
  thumbnailUrl: string;
  assetUrl: string;
  assetType: "png" | "webp";
  width: number;
  height: number;
  hasTransparentBackground: boolean;
  tags: string[];
  dominantColors?: string[];
  defaultScale?: number;
  recommendedRooms?: DecorRoomType[];
  createdAt?: string;
};

export const decorCategoryLabels: Record<DecorObjectCategory, string> = {
  sillones: "Sillones",
  sillas: "Sillas",
  mesas: "Mesas",
  macetas: "Macetas",
  plantas: "Plantas",
  lamparas: "Lámparas",
  alfombras: "Alfombras",
  cuadros: "Cuadros",
  estanterias: "Estanterías",
  decoracion: "Decoración",
  camas: "Camas",
  escritorios: "Escritorios",
};

export const decorStyleLabels: Record<DecorObjectStyle, string> = {
  moderno: "Moderno",
  minimalista: "Minimalista",
  clasico: "Clásico",
  industrial: "Industrial",
  nordico: "Nórdico",
  rustico: "Rústico",
  bohemio: "Bohemio",
  contemporaneo: "Contemporáneo",
};

export const decorRoomLabels: Record<DecorRoomType, string> = {
  sala: "Sala",
  dormitorio: "Dormitorio",
  comedor: "Comedor",
  oficina: "Oficina",
  pasillo: "Pasillo",
  terraza: "Terraza",
  cocina: "Cocina",
};

export function isSelectableDecorObject(object: DecorObject) {
  return Number.isFinite(object.width) && Number.isFinite(object.height) && object.width > 0 && object.height > 0 && Boolean(object.assetUrl);
}
