import type { DecorObject, DecorObjectCategory, DecorObjectStyle, DecorRoomType } from "@/types/decor-object";

type Definition = {
  slug: string;
  name: string;
  category: DecorObjectCategory;
  folder: string;
  style: DecorObjectStyle;
  colors: string[];
  rooms: DecorRoomType[];
  tags: string[];
  scale?: number;
};

const definitions: Definition[] = [
  { slug: "modern-beige-sofa", name: "Sillón moderno beige", category: "sillones", folder: "sofas", style: "moderno", colors: ["#D8C3A5", "#8B6F58"], rooms: ["sala", "oficina"], tags: ["beige", "tapizado", "tres plazas"], scale: 0.42 },
  { slug: "nordic-cream-armchair", name: "Sillón nórdico crema", category: "sillones", folder: "sofas", style: "nordico", colors: ["#F0E8D8", "#B99068"], rooms: ["sala", "dormitorio"], tags: ["crema", "madera", "lectura"] },
  { slug: "olive-lounge-chair", name: "Sillón lounge verde oliva", category: "sillones", folder: "sofas", style: "contemporaneo", colors: ["#7A8061", "#343B36"], rooms: ["sala", "oficina"], tags: ["oliva", "lounge", "acento"] },
  { slug: "rustic-caramel-sofa", name: "Sillón rústico caramelo", category: "sillones", folder: "sofas", style: "rustico", colors: ["#A96F45", "#654A38"], rooms: ["sala"], tags: ["caramelo", "cuero", "cálido"] },

  { slug: "light-wood-chair", name: "Silla de madera clara", category: "sillas", folder: "chairs", style: "nordico", colors: ["#D6B98C", "#F3EFE6"], rooms: ["comedor", "cocina"], tags: ["madera", "clara", "comedor"] },
  { slug: "black-metal-chair", name: "Silla metálica negra", category: "sillas", folder: "chairs", style: "industrial", colors: ["#252A28", "#6E726F"], rooms: ["comedor", "oficina"], tags: ["metal", "negra", "ligera"] },
  { slug: "woven-dining-chair", name: "Silla tejida natural", category: "sillas", folder: "chairs", style: "bohemio", colors: ["#C49B6C", "#8F6B48"], rooms: ["comedor", "terraza"], tags: ["tejida", "ratán", "natural"] },
  { slug: "blue-desk-chair", name: "Silla de escritorio azul", category: "sillas", folder: "chairs", style: "moderno", colors: ["#66849B", "#303A40"], rooms: ["oficina", "dormitorio"], tags: ["azul", "ergonómica", "trabajo"] },

  { slug: "round-side-table", name: "Mesa auxiliar redonda", category: "mesas", folder: "tables", style: "minimalista", colors: ["#C6A77B", "#3B413E"], rooms: ["sala", "dormitorio"], tags: ["redonda", "auxiliar", "madera"] },
  { slug: "oak-coffee-table", name: "Mesa de centro de roble", category: "mesas", folder: "tables", style: "nordico", colors: ["#B98D5C", "#E3C79F"], rooms: ["sala"], tags: ["roble", "centro", "rectangular"] },
  { slug: "glass-console-table", name: "Consola de vidrio ligera", category: "mesas", folder: "tables", style: "contemporaneo", colors: ["#B9D1D5", "#5E6667"], rooms: ["pasillo", "sala"], tags: ["vidrio", "consola", "ligera"] },
  { slug: "rustic-dining-table", name: "Mesa de comedor rústica", category: "mesas", folder: "tables", style: "rustico", colors: ["#845B3A", "#B98D62"], rooms: ["comedor", "cocina"], tags: ["comedor", "madera", "grande"], scale: 0.38 },

  { slug: "ceramic-tall-pot", name: "Maceta alta de cerámica", category: "macetas", folder: "pots", style: "minimalista", colors: ["#E2DDD2", "#9C9B91"], rooms: ["sala", "pasillo", "terraza"], tags: ["cerámica", "alta", "neutra"] },
  { slug: "terracotta-round-pot", name: "Maceta redonda de terracota", category: "macetas", folder: "pots", style: "rustico", colors: ["#B96F50", "#7C4938"], rooms: ["sala", "terraza", "cocina"], tags: ["terracota", "redonda", "cálida"] },
  { slug: "black-ribbed-pot", name: "Maceta estriada negra", category: "macetas", folder: "pots", style: "moderno", colors: ["#292E2C", "#555C58"], rooms: ["sala", "oficina"], tags: ["negra", "estriada", "alta"] },
  { slug: "sand-planter-set", name: "Juego de macetas arena", category: "macetas", folder: "pots", style: "contemporaneo", colors: ["#CDBB9D", "#9E8A6D"], rooms: ["terraza", "sala"], tags: ["arena", "juego", "orgánico"] },

  { slug: "large-tropical-plant", name: "Planta tropical grande", category: "plantas", folder: "plants", style: "bohemio", colors: ["#3F714F", "#244832"], rooms: ["sala", "terraza"], tags: ["tropical", "grande", "hojas"] },
  { slug: "olive-tree-planter", name: "Olivo decorativo en maceta", category: "plantas", folder: "plants", style: "rustico", colors: ["#718064", "#A67C52"], rooms: ["sala", "terraza", "pasillo"], tags: ["olivo", "árbol", "mediterráneo"] },
  { slug: "small-snake-plant", name: "Sansevieria compacta", category: "plantas", folder: "plants", style: "minimalista", colors: ["#52734D", "#A6A45E"], rooms: ["oficina", "dormitorio", "cocina"], tags: ["sansevieria", "compacta", "vertical"] },
  { slug: "hanging-fern", name: "Helecho colgante", category: "plantas", folder: "plants", style: "bohemio", colors: ["#4B7855", "#7FA06C"], rooms: ["sala", "terraza"], tags: ["helecho", "colgante", "frondoso"] },

  { slug: "black-floor-lamp", name: "Lámpara de piso negra", category: "lamparas", folder: "lamps", style: "industrial", colors: ["#232826", "#D1A85B"], rooms: ["sala", "oficina"], tags: ["piso", "negra", "lectura"] },
  { slug: "linen-table-lamp", name: "Lámpara de mesa de lino", category: "lamparas", folder: "lamps", style: "nordico", colors: ["#E6D8BF", "#B58D60"], rooms: ["dormitorio", "sala"], tags: ["mesa", "lino", "cálida"] },
  { slug: "brass-arc-lamp", name: "Lámpara de arco latón", category: "lamparas", folder: "lamps", style: "contemporaneo", colors: ["#B28B45", "#383B38"], rooms: ["sala"], tags: ["arco", "latón", "alta"] },
  { slug: "ceramic-bedside-lamp", name: "Lámpara de noche cerámica", category: "lamparas", folder: "lamps", style: "minimalista", colors: ["#D9D4C8", "#E9D39E"], rooms: ["dormitorio"], tags: ["noche", "cerámica", "suave"] },

  { slug: "neutral-woven-rug", name: "Alfombra tejida neutra", category: "alfombras", folder: "rugs", style: "nordico", colors: ["#D7C8AE", "#A89270"], rooms: ["sala", "dormitorio"], tags: ["tejida", "neutra", "textura"], scale: 0.5 },
  { slug: "geometric-gray-rug", name: "Alfombra geométrica gris", category: "alfombras", folder: "rugs", style: "moderno", colors: ["#7B817E", "#D7D7D2"], rooms: ["sala", "oficina"], tags: ["geométrica", "gris", "patrón"] },
  { slug: "rust-oval-rug", name: "Alfombra ovalada óxido", category: "alfombras", folder: "rugs", style: "bohemio", colors: ["#A65E43", "#D0A178"], rooms: ["sala", "dormitorio"], tags: ["ovalada", "óxido", "cálida"] },
  { slug: "blue-flatweave-rug", name: "Alfombra plana azul", category: "alfombras", folder: "rugs", style: "contemporaneo", colors: ["#55758A", "#C9D4D6"], rooms: ["sala", "pasillo"], tags: ["azul", "plana", "ligera"] },

  { slug: "warm-abstract-art", name: "Cuadro abstracto cálido", category: "cuadros", folder: "art", style: "contemporaneo", colors: ["#C98276", "#D8C3A5", "#6D5747"], rooms: ["sala", "dormitorio"], tags: ["abstracto", "cálido", "arte"] },
  { slug: "minimal-line-art", name: "Cuadro de líneas minimalista", category: "cuadros", folder: "art", style: "minimalista", colors: ["#EFE9DE", "#303633"], rooms: ["sala", "oficina", "pasillo"], tags: ["líneas", "minimalista", "blanco"] },
  { slug: "botanical-print", name: "Lámina botánica verde", category: "cuadros", folder: "art", style: "nordico", colors: ["#678267", "#E9E2D3"], rooms: ["sala", "dormitorio", "cocina"], tags: ["botánica", "verde", "lámina"] },
  { slug: "blue-shape-art", name: "Cuadro de formas azules", category: "cuadros", folder: "art", style: "moderno", colors: ["#55778B", "#A7BED3", "#E8E3D9"], rooms: ["sala", "oficina"], tags: ["formas", "azul", "gráfico"] },

  { slug: "oak-open-shelf", name: "Estantería abierta de roble", category: "estanterias", folder: "shelves", style: "nordico", colors: ["#BD9468", "#E3C9A4"], rooms: ["sala", "oficina"], tags: ["abierta", "roble", "libros"] },
  { slug: "black-metal-shelf", name: "Estantería metálica negra", category: "estanterias", folder: "shelves", style: "industrial", colors: ["#292E2C", "#8B6A4D"], rooms: ["sala", "oficina", "cocina"], tags: ["metal", "negra", "alta"] },
  { slug: "low-white-shelf", name: "Estantería baja blanca", category: "estanterias", folder: "shelves", style: "minimalista", colors: ["#EDECE7", "#B7BAB5"], rooms: ["sala", "dormitorio"], tags: ["baja", "blanca", "modular"] },
  { slug: "arched-wood-shelf", name: "Estantería arqueada de madera", category: "estanterias", folder: "shelves", style: "bohemio", colors: ["#9B714C", "#C59B72"], rooms: ["sala", "pasillo"], tags: ["arqueada", "madera", "orgánica"] },

  { slug: "ceramic-vase-set", name: "Jarrones de cerámica neutros", category: "decoracion", folder: "accessories", style: "minimalista", colors: ["#D9D2C5", "#AFA79A"], rooms: ["sala", "comedor", "pasillo"], tags: ["jarrones", "cerámica", "juego"] },
  { slug: "woven-basket", name: "Canasta tejida natural", category: "decoracion", folder: "accessories", style: "bohemio", colors: ["#B98B58", "#80603F"], rooms: ["sala", "dormitorio"], tags: ["canasta", "tejida", "almacenaje"] },
  { slug: "round-wall-mirror", name: "Espejo redondo con marco", category: "decoracion", folder: "accessories", style: "contemporaneo", colors: ["#B08A55", "#BFD0D2"], rooms: ["pasillo", "dormitorio", "sala"], tags: ["espejo", "redondo", "marco"] },
  { slug: "stone-sculpture", name: "Escultura abstracta de piedra", category: "decoracion", folder: "accessories", style: "moderno", colors: ["#B8B4AA", "#777970"], rooms: ["sala", "oficina"], tags: ["escultura", "piedra", "abstracta"] },

  { slug: "linen-platform-bed", name: "Cama plataforma de lino", category: "camas", folder: "beds", style: "minimalista", colors: ["#D8CEBE", "#9F866A"], rooms: ["dormitorio"], tags: ["cama", "lino", "plataforma"], scale: 0.46 },
  { slug: "oak-headboard-bed", name: "Cama con cabecero de roble", category: "camas", folder: "beds", style: "nordico", colors: ["#BE9568", "#F0E9DD"], rooms: ["dormitorio"], tags: ["cabecero", "roble", "clara"] },
  { slug: "blue-upholstered-bed", name: "Cama tapizada azul niebla", category: "camas", folder: "beds", style: "contemporaneo", colors: ["#829AA5", "#E7E2D8"], rooms: ["dormitorio"], tags: ["tapizada", "azul", "suave"] },
  { slug: "rustic-wood-bed", name: "Cama de madera rústica", category: "camas", folder: "beds", style: "rustico", colors: ["#855F43", "#D7C3A4"], rooms: ["dormitorio"], tags: ["madera", "rústica", "cálida"] },

  { slug: "slim-oak-desk", name: "Escritorio delgado de roble", category: "escritorios", folder: "desks", style: "nordico", colors: ["#C59A68", "#E8D4B4"], rooms: ["oficina", "dormitorio"], tags: ["delgado", "roble", "trabajo"] },
  { slug: "black-frame-desk", name: "Escritorio con marco negro", category: "escritorios", folder: "desks", style: "industrial", colors: ["#252A28", "#9A7252"], rooms: ["oficina"], tags: ["negro", "metal", "trabajo"] },
  { slug: "white-compact-desk", name: "Escritorio compacto blanco", category: "escritorios", folder: "desks", style: "minimalista", colors: ["#EEEDE8", "#AEB2AE"], rooms: ["oficina", "dormitorio"], tags: ["compacto", "blanco", "pequeño"] },
  { slug: "walnut-writing-desk", name: "Escritorio de nogal", category: "escritorios", folder: "desks", style: "clasico", colors: ["#73503A", "#A77B58"], rooms: ["oficina", "sala"], tags: ["nogal", "escritura", "clásico"] },
];

export const decorObjects: DecorObject[] = definitions.map((definition, index) => ({
  id: `decor-${String(index + 1).padStart(3, "0")}-${definition.slug}`,
  name: definition.name,
  category: definition.category,
  style: definition.style,
  thumbnailUrl: `/decor/${definition.folder}/${definition.slug}-thumb.webp`,
  assetUrl: `/decor/${definition.folder}/${definition.slug}.webp`,
  assetType: "webp",
  width: 800,
  height: 800,
  hasTransparentBackground: true,
  tags: definition.tags,
  dominantColors: definition.colors,
  defaultScale: definition.scale ?? 0.3,
  recommendedRooms: definition.rooms,
  createdAt: "2026-07-12T00:00:00.000Z",
}));

export const decorObjectsById = new Map(decorObjects.map((object) => [object.id, object]));
