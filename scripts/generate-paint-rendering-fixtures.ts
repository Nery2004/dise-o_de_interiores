import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "tests/fixtures/paint-rendering");
const WIDTH = 96;
const HEIGHT = 64;

type Fixture = {
  id: string;
  description: string;
  targetColor: string;
  notes: string;
  feather?: number;
  pixel: (x: number, y: number) => [number, number, number];
  mask?: (x: number, y: number) => boolean;
};

const rgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};
const solid = (hex: string) => () => rgb(hex);
const shade = (color: [number, number, number], factor: number): [number, number, number] => color.map((value) => Math.max(0, Math.min(255, Math.round(value * factor)))) as [number, number, number];

const fixtures: Fixture[] = [
  { id: "flat-white-wall", description: "Pared blanca plana", targetColor: "#A8B5A2", notes: "Control de color sin textura", pixel: solid("#F2F1ED") },
  { id: "beige-wall", description: "Verde salvia sobre pared beige", targetColor: "#A8B5A2", notes: "No debe conservar dominante amarilla", pixel: solid("#C8B49A") },
  { id: "yellow-wall", description: "Azul sobre pared amarilla", targetColor: "#A7BED3", notes: "No debe verse verde", pixel: solid("#E2C84B") },
  { id: "blue-wall", description: "Terracota sobre pared azul", targetColor: "#C98276", notes: "Neutralización de dominante fría", pixel: solid("#789CC8") },
  { id: "dark-gray-wall", description: "Blanco cálido sobre gris oscuro", targetColor: "#F5F1E8", notes: "Debe aclarar sin borrar profundidad", pixel: solid("#4B4D50") },
  { id: "light-gradient", description: "Gradiente horizontal de iluminación", targetColor: "#A8B5A2", notes: "Conservar gradiente suave sin banding", pixel: (x) => { const base = rgb("#B9AA94"); return shade(base, 0.65 + x / (WIDTH - 1) * 0.55); } },
  { id: "lateral-shadow", description: "Sombra lateral fuerte", targetColor: "#A8B5A2", notes: "La mitad izquierda debe seguir más oscura", pixel: (x) => shade(rgb("#C5B39D"), x < WIDTH / 2 ? 0.58 : 1) },
  { id: "subtle-texture", description: "Textura sinusoidal leve", targetColor: "#B97A65", notes: "Conservar detalle de alta frecuencia", pixel: (x, y) => shade(rgb("#B9AF9F"), 1 + Math.sin(x * 0.7) * Math.cos(y * 0.55) * 0.055) },
  { id: "white-reflection", description: "Pared con reflejo blanco", targetColor: "#7E9BAF", notes: "El reflejo no debe saturarse con el color", pixel: (x, y) => x > 38 && x < 58 && y > 10 && y < 30 ? rgb("#FFFFFF") : rgb("#B8B0A4") },
  { id: "room-corner", description: "Esquina con dos planos de luz", targetColor: "#A8B5A2", notes: "Conservar discontinuidad de iluminación", pixel: (x) => x < WIDTH / 2 ? rgb("#A89B8B") : rgb("#D0C5B5") },
  { id: "photo-noise", description: "Pared con ruido fotográfico determinista", targetColor: "#A8B5A2", notes: "No amplificar ruido", pixel: (x, y) => { const seed = ((x * 73856093) ^ (y * 19349663)) >>> 0; const noise = (seed % 13) - 6; return rgb("#BEB2A1").map((value) => value + noise) as [number, number, number]; } },
  { id: "feather-mask", description: "Máscara parcial con borde de alto contraste", targetColor: "#B33A3A", notes: "Medir transición, fuga y halo", feather: 10, pixel: (x) => x < WIDTH / 2 ? rgb("#F1EEE8") : rgb("#55585D"), mask: (x, y) => x >= 24 && x < 72 && y >= 12 && y < 52 },
];

async function generate() {
  await rm(ROOT, { recursive: true, force: true });
  await mkdir(ROOT, { recursive: true });
  for (const fixture of fixtures) {
    const directory = path.join(ROOT, fixture.id);
    await mkdir(directory, { recursive: true });
    const image = Buffer.alloc(WIDTH * HEIGHT * 3);
    const mask = Buffer.alloc(WIDTH * HEIGHT);
    for (let y = 0; y < HEIGHT; y += 1) for (let x = 0; x < WIDTH; x += 1) {
      const index = y * WIDTH + x;
      const color = fixture.pixel(x, y);
      image[index * 3] = color[0]; image[index * 3 + 1] = color[1]; image[index * 3 + 2] = color[2];
      mask[index] = (fixture.mask?.(x, y) ?? (x >= 6 && x < 90 && y >= 6 && y < 58)) ? 255 : 0;
    }
    await sharp(image, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } }).webp({ quality: 95 }).toFile(path.join(directory, "image.webp"));
    await sharp(mask, { raw: { width: WIDTH, height: HEIGHT, channels: 1 } }).png({ compressionLevel: 9, colours: 2 }).toFile(path.join(directory, "mask.png"));
    await writeFile(path.join(directory, "metadata.json"), `${JSON.stringify({
      id: fixture.id,
      description: fixture.description,
      targetColor: fixture.targetColor,
      width: WIDTH,
      height: HEIGHT,
      mask: "mask.png",
      image: "image.webp",
      synthetic: true,
      settings: {
        paintMode: "white-base",
        paintIntensity: 100,
        primerCoverage: 100,
        shadowPreservation: 90,
        texturePreservation: 90,
        edgeFeather: fixture.feather ?? 0,
        blendMode: "paint-simulation",
        quality: "high"
      },
      notes: fixture.notes,
    }, null, 2)}\n`);
  }
  await writeFile(path.join(ROOT, "README.md"), `# Fixtures sintéticos de pintura\n\n${fixtures.length} casos propios de ${WIDTH}×${HEIGHT} px. Sirven para métricas controladas de color, luminancia, sombras, textura y feather. No representan pintura física ni sustituyen pruebas con fotografías y pantallas reales.\n`);
}

generate().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
