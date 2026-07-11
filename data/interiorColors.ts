import { hexToHsl, hexToRgb } from "@/lib/colors/colorConversion";
import type { ColorCategory, ColorMood, ColorUndertone, InteriorColor, RoomType } from "@/types/color";

type Seed = [name: string, hex: string, category: ColorCategory, undertone: ColorUndertone, mood: ColorMood];

const seeds: Seed[] = [
  ["Blanco lino", "#F5F1E8", "blancos", "calido", "acogedor"], ["Blanco porcelana", "#F7F7F2", "blancos", "frio", "minimalista"], ["Blanco nube", "#F1F3F2", "blancos", "neutro", "relajante"], ["Blanco marfil", "#F4EBD8", "blancos", "calido", "elegante"], ["Blanco tiza", "#ECECE6", "blancos", "neutro", "moderno"], ["Blanco glaciar", "#EEF4F5", "blancos", "frio", "minimalista"],
  ["Arena suave", "#D8C3A5", "beige", "calido", "natural"], ["Beige avena", "#D9CBB5", "beige", "calido", "acogedor"], ["Lino tostado", "#CDBB9F", "beige", "calido", "natural"], ["Piedra crema", "#E1D6C3", "beige", "neutro", "elegante"], ["Trigo claro", "#DCC9A6", "beige", "calido", "acogedor"], ["Cáñamo suave", "#C6B79F", "beige", "neutro", "natural"],
  ["Gris niebla", "#D9D9D9", "grises", "frio", "relajante"], ["Gris perla", "#CFD2D1", "grises", "neutro", "elegante"], ["Gris paloma", "#B9BCB8", "grises", "frio", "moderno"], ["Gris cemento", "#9B9D9A", "grises", "neutro", "moderno"], ["Gris pizarra", "#636A6D", "grises", "frio", "elegante"], ["Gris humo", "#858784", "grises", "neutro", "minimalista"], ["Gris tormenta", "#4F565B", "grises", "frio", "elegante"],
  ["Verde salvia", "#A8B5A2", "verdes", "neutro", "relajante"], ["Verde oliva claro", "#B7B597", "verdes", "calido", "natural"], ["Verde eucalipto", "#8FA59A", "verdes", "frio", "relajante"], ["Verde musgo", "#68745A", "verdes", "calido", "natural"], ["Verde helecho", "#75866C", "verdes", "neutro", "natural"], ["Verde bosque", "#344D3D", "verdes", "frio", "elegante"], ["Verde arcilla", "#9A9F7A", "verdes", "calido", "acogedor"],
  ["Azul niebla", "#A7BED3", "azules", "frio", "relajante"], ["Azul cielo suave", "#BED3DF", "azules", "frio", "relajante"], ["Azul grisáceo", "#879DAA", "azules", "neutro", "moderno"], ["Azul profundo", "#304A60", "azules", "frio", "elegante"], ["Azul océano", "#416B78", "azules", "frio", "natural"], ["Azul tinta", "#263B4B", "azules", "frio", "elegante"], ["Azul lavanda", "#AEB7CC", "azules", "neutro", "relajante"],
  ["Terracota cálida", "#C98276", "terracotas", "calido", "acogedor"], ["Arcilla rosada", "#C58F7E", "terracotas", "calido", "natural"], ["Barro suave", "#B87864", "terracotas", "calido", "acogedor"], ["Teja apagada", "#A96052", "terracotas", "calido", "energico"], ["Canela terrosa", "#A9785B", "terracotas", "calido", "natural"], ["Cobre mate", "#98634F", "terracotas", "calido", "elegante"],
  ["Rosa empolvado", "#D5B3AF", "rosados", "calido", "relajante"], ["Rosa arcilla", "#C9A39A", "rosados", "calido", "acogedor"], ["Rosa malva", "#B99AA6", "rosados", "frio", "elegante"], ["Rosa pétalo", "#E2C7C3", "rosados", "calido", "relajante"], ["Rosa antiguo", "#B78482", "rosados", "neutro", "elegante"], ["Rosa piedra", "#C5AAA4", "rosados", "neutro", "minimalista"],
  ["Amarillo mantequilla", "#E8D9A8", "amarillos", "calido", "acogedor"], ["Paja suave", "#DCCB91", "amarillos", "calido", "natural"], ["Mostaza clara", "#CDB064", "amarillos", "calido", "energico"], ["Sol apagado", "#E3C878", "amarillos", "calido", "energico"], ["Crema dorada", "#E7D6AA", "amarillos", "calido", "acogedor"], ["Ocre sereno", "#B99552", "amarillos", "calido", "natural"],
  ["Carbón suave", "#343B36", "oscuros", "neutro", "elegante"], ["Grafito", "#4A4A4A", "oscuros", "frio", "moderno"], ["Negro tinta", "#252A2C", "oscuros", "frio", "elegante"], ["Café cacao", "#4D3B32", "oscuros", "calido", "acogedor"], ["Verde nocturno", "#26372F", "oscuros", "frio", "elegante"], ["Azul medianoche", "#222F40", "oscuros", "frio", "elegante"],
  ["Greige claro", "#CBC5B9", "neutros", "neutro", "minimalista"], ["Greige piedra", "#B6AEA1", "neutros", "neutro", "moderno"], ["Topo suave", "#A99C8C", "neutros", "calido", "elegante"], ["Seta clara", "#C7BCAF", "neutros", "neutro", "natural"], ["Lodo seco", "#958B7D", "neutros", "calido", "natural"], ["Visón moderno", "#81766E", "neutros", "neutro", "elegante"], ["Piedra urbana", "#AAA7A0", "neutros", "frio", "moderno"], ["Almendra gris", "#C9C1B4", "neutros", "calido", "minimalista"],
];

const roomsByCategory: Record<ColorCategory, RoomType[]> = {
  blancos: ["sala", "cocina", "baño", "pasillo"], beige: ["sala", "dormitorio", "comedor"], grises: ["sala", "oficina", "cocina"], verdes: ["sala", "dormitorio", "oficina"], azules: ["dormitorio", "baño", "oficina"], terracotas: ["sala", "comedor", "pasillo"], rosados: ["dormitorio", "infantil", "baño"], amarillos: ["cocina", "comedor", "infantil"], oscuros: ["sala", "comedor", "oficina"], neutros: ["sala", "dormitorio", "oficina", "pasillo"],
};

export const interiorColors: InteriorColor[] = seeds.map(([name, hex, category, undertone, mood], index) => ({
  id: `interior-${String(index + 1).padStart(3, "0")}`,
  name, hex,
  rgb: hexToRgb(hex)!,
  hsl: hexToHsl(hex)!,
  category, undertone, mood,
  roomTypes: roomsByCategory[category],
  tags: [...name.toLowerCase().split(" "), category, undertone, mood],
}));
