export const decorObjectCategories = [
  "sillones", "sillas", "mesas", "macetas", "plantas", "lamparas",
  "alfombras", "cuadros", "estanterias", "decoracion", "camas", "escritorios",
] as const;

export const premiumDecorCategories = [
  "sofas", "sillones", "loveseats", "sillas", "bancas", "mesas-centro",
  "mesas-auxiliares", "comedores", "escritorios", "libreros", "estanterias",
  "plantas", "macetas", "cuadros", "espejos", "lamparas", "cortinas",
  "alfombras", "decoracion", "jarrones", "cojines", "camas", "buros",
  "muebles-tv",
] as const;

export const decorCollectionIds = [
  "minimalista", "japandi", "industrial", "moderno", "bohemio",
  "escandinavo", "lujo", "contemporaneo", "mediterraneo", "rustico", "vintage",
] as const;

export const decorObjectStyles = [
  "moderno", "minimalista", "clasico", "industrial", "nordico", "rustico",
  "bohemio", "contemporaneo",
] as const;

export const decorRoomTypes = [
  "sala", "dormitorio", "comedor", "oficina", "pasillo", "terraza", "cocina",
] as const;

export type DecorObjectCategory = typeof decorObjectCategories[number];
export type PremiumDecorCategory = typeof premiumDecorCategories[number];
export type DecorCollectionId = typeof decorCollectionIds[number];
export type DecorObjectStyle = typeof decorObjectStyles[number];
export type DecorRoomType = typeof decorRoomTypes[number];

export type DecorObject = {
  id: string;
  name: string;
  category: DecorObjectCategory;
  catalogCategory: PremiumDecorCategory;
  style: DecorObjectStyle;
  thumbnailUrl: string;
  assetUrl: string;
  assetType: "png" | "webp";
  width: number;
  height: number;
  hasTransparentBackground: boolean;
  tags: string[];
  collectionIds: DecorCollectionId[];
  approximateWidthCm: number;
  approximateHeightCm: number;
  approximateDepthCm?: number;
  variants?: Array<{
    id: string;
    name: string;
    assetUrl: string;
    thumbnailUrl: string;
    dominantColors?: string[];
  }>;
  dominantColors?: string[];
  defaultScale?: number;
  recommendedRooms?: DecorRoomType[];
  createdAt?: string;
};

export type DecorObjectFolder = {
  id: string;
  name: string;
  objectIds: string[];
  createdAt: string;
  updatedAt: string;
};

export const premiumDecorCategoryLabels: Record<PremiumDecorCategory, string> = {
  sofas: "Sofás", sillones: "Sillones", loveseats: "Loveseats", sillas: "Sillas",
  bancas: "Bancas", "mesas-centro": "Mesas de centro", "mesas-auxiliares": "Mesas auxiliares",
  comedores: "Comedores", escritorios: "Escritorios", libreros: "Libreros",
  estanterias: "Estanterías", plantas: "Plantas", macetas: "Macetas", cuadros: "Cuadros",
  espejos: "Espejos", lamparas: "Lámparas", cortinas: "Cortinas", alfombras: "Alfombras",
  decoracion: "Decoración", jarrones: "Jarrones", cojines: "Cojines", camas: "Camas",
  buros: "Burós", "muebles-tv": "Muebles de TV",
};

export const premiumDecorCategoryColors: Record<PremiumDecorCategory, string> = {
  sofas: "#8b6f58", sillones: "#a47b64", loveseats: "#b48b72", sillas: "#7b8794",
  bancas: "#8a7862", "mesas-centro": "#96724f", "mesas-auxiliares": "#aa875f",
  comedores: "#735f4a", escritorios: "#596c78", libreros: "#7a684e", estanterias: "#6e6455",
  plantas: "#52734d", macetas: "#a66d51", cuadros: "#9b6573", espejos: "#66848c",
  lamparas: "#b28b45", cortinas: "#8c829d", alfombras: "#a47b68", decoracion: "#777970",
  jarrones: "#80918c", cojines: "#a26f6f", camas: "#7d7184", buros: "#816d59", "muebles-tv": "#515b5b",
};

export const decorCollectionLabels: Record<DecorCollectionId, string> = {
  minimalista: "Minimalista", japandi: "Japandi", industrial: "Industrial", moderno: "Moderno",
  bohemio: "Bohemio", escandinavo: "Escandinavo", lujo: "Lujo", contemporaneo: "Contemporáneo",
  mediterraneo: "Mediterráneo", rustico: "Rústico", vintage: "Vintage",
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
