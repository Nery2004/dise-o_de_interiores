import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "tests/fixtures/wall-detection");
const WIDTH = 96;
const HEIGHT = 64;

type Point = [number, number];
type Polygon = Point[];
type ExclusionType = "ceiling" | "floor" | "window" | "door" | "curtain" | "sofa" | "picture" | "television" | "furniture";
type Exclusion = { type: ExclusionType; polygon: Polygon };
type Fixture = {
  id: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  walls: Polygon[];
  exclusions?: Exclusion[];
  tags: string[];
  predictionShift?: Point;
  notes?: string;
};

const rectangle = (left: number, top: number, right: number, bottom: number): Polygon =>
  [[left, top], [right, top], [right, bottom], [left, bottom]];

const fixtures: Fixture[] = [
  { id: "clean-front-wall", description: "Pared frontal limpia", difficulty: "easy", walls: [rectangle(8, 8, 88, 52)], tags: ["front-wall", "clean"] },
  { id: "side-wall", description: "Pared lateral en perspectiva", difficulty: "medium", walls: [[[2, 12], [56, 7], [55, 54], [1, 59]]], tags: ["side-wall", "perspective"], predictionShift: [1, 0] },
  { id: "wall-with-window", description: "Pared frontal con ventana central", difficulty: "medium", walls: [rectangle(7, 7, 89, 53)], exclusions: [{ type: "window", polygon: rectangle(36, 18, 61, 39) }], tags: ["window", "opening"] },
  { id: "wall-with-curtain", description: "Pared con cortina delante de una ventana", difficulty: "hard", walls: [rectangle(6, 7, 90, 53)], exclusions: [{ type: "curtain", polygon: rectangle(30, 13, 65, 48) }], tags: ["curtain", "occlusion"] },
  { id: "wall-with-sofa", description: "Pared parcialmente ocluida por sofá", difficulty: "medium", walls: [rectangle(6, 7, 90, 53)], exclusions: [{ type: "sofa", polygon: rectangle(22, 38, 75, 54) }], tags: ["sofa", "furniture", "occlusion"] },
  { id: "wall-with-pictures", description: "Pared con dos cuadros", difficulty: "medium", walls: [rectangle(7, 7, 89, 53)], exclusions: [{ type: "picture", polygon: rectangle(22, 18, 36, 31) }, { type: "picture", polygon: rectangle(58, 16, 73, 30) }], tags: ["picture", "wall-decoration"] },
  { id: "wall-with-television", description: "Pared con televisión central", difficulty: "medium", walls: [rectangle(6, 7, 90, 53)], exclusions: [{ type: "television", polygon: rectangle(34, 20, 64, 39) }], tags: ["television", "object"] },
  { id: "wall-with-door", description: "Pared frontal con puerta", difficulty: "medium", walls: [rectangle(5, 7, 91, 55)], exclusions: [{ type: "door", polygon: rectangle(61, 20, 81, 55) }], tags: ["door", "opening"] },
  { id: "dark-wall", description: "Pared oscura con poco contraste", difficulty: "hard", walls: [rectangle(7, 8, 89, 53)], tags: ["dark", "low-contrast"], predictionShift: [2, 1] },
  { id: "white-wall", description: "Pared blanca con iluminación uniforme", difficulty: "easy", walls: [rectangle(7, 7, 89, 53)], tags: ["white", "low-texture"] },
  { id: "multiple-walls", description: "Habitación con tres paredes visibles", difficulty: "hard", walls: [[[1, 13], [31, 7], [34, 52], [1, 59]], [[31, 7], [66, 8], [63, 52], [34, 52]], [[66, 8], [95, 14], [95, 59], [63, 52]]], tags: ["multi-wall", "perspective"] },
  { id: "wall-with-columns", description: "Dos paños de pared separados por columnas", difficulty: "hard", walls: [rectangle(5, 8, 39, 53), rectangle(56, 8, 91, 53)], exclusions: [{ type: "furniture", polygon: rectangle(40, 6, 55, 56) }], tags: ["columns", "multi-wall"] },
  { id: "strong-light", description: "Pared con iluminación lateral fuerte", difficulty: "hard", walls: [rectangle(7, 7, 89, 53)], tags: ["strong-light", "gradient"], predictionShift: [-1, 0] },
  { id: "wall-with-shadows", description: "Pared con sombras diagonales", difficulty: "hard", walls: [rectangle(7, 7, 89, 53)], tags: ["shadow", "uneven-light"] },
  { id: "partially-occluded-wall", description: "Pared parcialmente tapada por varios muebles", difficulty: "hard", walls: [rectangle(6, 7, 90, 54)], exclusions: [{ type: "furniture", polygon: rectangle(8, 34, 31, 55) }, { type: "sofa", polygon: rectangle(42, 39, 82, 55) }], tags: ["occlusion", "furniture", "partial"] },
];

function insidePolygon(x: number, y: number, polygon: Polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const before = polygon[previous];
    if ((current[1] > y) !== (before[1] > y) && x < ((before[0] - current[0]) * (y - current[1])) / (before[1] - current[1] || 1e-9) + current[0])
      inside = !inside;
  }
  return inside;
}

function polygonMask(polygon: Polygon) {
  const data = new Uint8Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1)
    for (let x = 0; x < WIDTH; x += 1)
      if (insidePolygon(x + 0.5, y + 0.5, polygon)) data[y * WIDTH + x] = 1;
  return data;
}

function exclusionMask(exclusions: Exclusion[], type?: ExclusionType) {
  const data = new Uint8Array(WIDTH * HEIGHT);
  for (const exclusion of exclusions) {
    if (type && exclusion.type !== type) continue;
    const region = polygonMask(exclusion.polygon);
    for (let index = 0; index < data.length; index += 1) if (region[index]) data[index] = 1;
  }
  return data;
}

function shiftedPolygon(polygon: Polygon, [dx, dy]: Point): Polygon {
  return polygon.map(([x, y]) => [Math.max(0, Math.min(WIDTH, x + dx)), Math.max(0, Math.min(HEIGHT, y + dy))]);
}

function buildExpected(wall: Polygon, exclusions: Exclusion[]) {
  const data = polygonMask(wall);
  const excluded = exclusionMask(exclusions);
  for (let index = 0; index < data.length; index += 1) if (excluded[index]) data[index] = 0;
  return data;
}

function buildRecordedPrediction(fixture: Fixture, wall: Polygon, wallIndex: number) {
  const shifted = shiftedPolygon(wall, fixture.predictionShift ?? [wallIndex % 2, wallIndex % 3 === 0 ? 1 : 0]);
  const data = polygonMask(shifted);
  // Recorded output deliberately contains deterministic edge noise and semantic leakage.
  for (let y = 0; y < HEIGHT; y += 1) for (let x = 0; x < WIDTH; x += 1) {
    const index = y * WIDTH + x;
    if ((x * 17 + y * 13 + wallIndex * 7) % 211 === 0) data[index] = 1;
  }
  return data;
}

async function writeBinaryPng(target: string, mask: Uint8Array) {
  await sharp(Buffer.from(mask.map((value) => value ? 255 : 0)), {
    raw: { width: WIDTH, height: HEIGHT, channels: 1 },
  }).png({ compressionLevel: 9, colours: 2 }).toFile(target);
}

function imageFor(fixture: Fixture, expectedWalls: Uint8Array[], exclusions: Exclusion[]) {
  const data = new Uint8Array(WIDTH * HEIGHT * 3);
  const dark = fixture.id === "dark-wall";
  const white = fixture.id === "white-wall";
  for (let y = 0; y < HEIGHT; y += 1) for (let x = 0; x < WIDTH; x += 1) {
    const index = y * WIDTH + x;
    let color: [number, number, number] = y < 7 ? [218, 220, 222] : y > 54 ? [124, 98, 76] : [198, 190, 178];
    if (expectedWalls.some((wall) => wall[index])) {
      const lightGradient = fixture.id === "strong-light" ? Math.round(80 * x / WIDTH) : 0;
      color = dark ? [58 + lightGradient / 5, 55 + lightGradient / 5, 52 + lightGradient / 5] as [number, number, number]
        : white ? [242, 242, 239]
          : [188 + lightGradient, 181 + lightGradient, 169 + lightGradient].map((value) => Math.min(255, value)) as [number, number, number];
      if (fixture.id === "wall-with-shadows" && x - y > 25 && x - y < 39) color = [125, 120, 114];
    }
    data[index * 3] = color[0]; data[index * 3 + 1] = color[1]; data[index * 3 + 2] = color[2];
  }
  const palette: Record<ExclusionType, [number, number, number]> = {
    ceiling: [220, 220, 220], floor: [124, 98, 76], window: [120, 184, 218], door: [103, 72, 49], curtain: [158, 117, 142], sofa: [70, 107, 93], picture: [115, 78, 48], television: [27, 31, 35], furniture: [103, 81, 62],
  };
  for (const exclusion of exclusions) {
    const mask = polygonMask(exclusion.polygon);
    const color = palette[exclusion.type];
    for (let index = 0; index < mask.length; index += 1) if (mask[index]) {
      data[index * 3] = color[0]; data[index * 3 + 1] = color[1]; data[index * 3 + 2] = color[2];
    }
  }
  return data;
}

async function generate() {
  await rm(ROOT, { recursive: true, force: true });
  await mkdir(ROOT, { recursive: true });
  for (const fixture of fixtures) {
    const directory = path.join(ROOT, fixture.id);
    await mkdir(directory, { recursive: true });
    const exclusions = fixture.exclusions ?? [];
    const expected = fixture.walls.map((wall) => buildExpected(wall, exclusions));
    await sharp(Buffer.from(imageFor(fixture, expected, exclusions)), {
      raw: { width: WIDTH, height: HEIGHT, channels: 3 },
    }).webp({ quality: 90 }).toFile(path.join(directory, "image.webp"));
    for (let index = 0; index < expected.length; index += 1) {
      await writeBinaryPng(path.join(directory, `expected-wall-${index + 1}.png`), expected[index]);
      await writeBinaryPng(path.join(directory, `recorded-raw-wall-${index + 1}.png`), buildRecordedPrediction(fixture, fixture.walls[index], index));
    }
    const exclusionTypes = [...new Set(exclusions.map((exclusion) => exclusion.type))].sort();
    for (const type of exclusionTypes)
      await writeBinaryPng(path.join(directory, `exclude-${type}.png`), exclusionMask(exclusions, type));
    const metadata = {
      id: fixture.id,
      description: fixture.description,
      difficulty: fixture.difficulty,
      expectedWalls: fixture.walls.length,
      excludeRegions: exclusionTypes,
      tags: fixture.tags,
      notes: fixture.notes ?? "Fixture geométrico sintético; no sustituye fotografías reales etiquetadas.",
      synthetic: true,
      width: WIDTH,
      height: HEIGHT,
      expectedMasks: expected.map((_, index) => `expected-wall-${index + 1}.png`),
      recordedPredictions: expected.map((_, index) => `recorded-raw-wall-${index + 1}.png`),
      exclusionMasks: Object.fromEntries(exclusionTypes.map((type) => [type, `exclude-${type}.png`])),
    };
    await writeFile(path.join(directory, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  }
  await writeFile(path.join(ROOT, "README.md"), `# Dataset sintético de paredes\n\n${fixtures.length} casos propios de ${WIDTH}×${HEIGHT} px. Las máscaras PNG son binarias sin antialias: blanco representa pared o exclusión y negro fondo. \`recorded-raw-wall-*.png\` simula salidas deterministas de un modelo para medir el postprocesamiento. Estos fixtures validan geometría y regresiones, pero no permiten afirmar precisión sobre fotografías reales.\n`);
}

generate().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
