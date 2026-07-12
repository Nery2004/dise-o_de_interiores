import assert from "node:assert/strict";
import test from "node:test";
import { BinaryMaskProcessor } from "@/lib/wallDetection/pipeline/BinaryMaskProcessor";
import { ContourExtractor } from "@/lib/wallDetection/pipeline/ContourExtractor";
import { PolygonSimplifier } from "@/lib/wallDetection/pipeline/PolygonSimplifier";
import { SegmentationPipeline } from "@/lib/wallDetection/pipeline/SegmentationPipeline";
import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

function mask(width: number, height: number, fill: (x: number, y: number) => boolean): BinaryMask {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (fill(x, y)) data[y * width + x] = 1;
  return { width, height, data };
}

test("limpia ruido, cierra huecos y conserva paredes separadas", () => {
  const source = mask(40, 24, (x, y) =>
    (x >= 2 && x <= 14 && y >= 3 && y <= 20 && !(x >= 7 && x <= 9 && y >= 9 && y <= 11)) ||
    (x >= 24 && x <= 37 && y >= 4 && y <= 19) || (x === 20 && y === 1));
  const processor = new BinaryMaskProcessor();
  const cleaned = processor.process(source, 0.4);
  const components = processor.connectedComponents(cleaned, 20);
  assert.equal(components.length, 2);
  assert.equal(cleaned.data[10 * source.width + 8], 1, "el hueco interior debe rellenarse");
  assert.ok(components.every((component) => component.data[1 * source.width + 20] === 0), "el ruido aislado debe descartarse al separar componentes");
});

test("extrae contornos ordenados y simplifica bordes rectos", () => {
  const source = mask(60, 40, (x, y) => x >= 8 && x <= 49 && y >= 7 && y <= 31);
  const contour = new ContourExtractor().extract(source);
  const polygon = new PolygonSimplifier().simplify(contour, 1.5);
  assert.ok(contour.length > 100);
  assert.ok(polygon.length >= 4 && polygon.length <= 6);
});

test("el pipeline raster genera WallMask compatibles, calidad y métricas dentro del presupuesto", async () => {
  const provider = {
    async segmentWalls({ processingDimensions }: { processingDimensions: { width: number; height: number } }) {
      return {
        modelVersion: "benchmark-fixture-v1",
        regions: [{ id: "room-wall", name: "Pared principal", confidence: 0.93, mask: mask(processingDimensions.width, processingDimensions.height, (x, y) => x > 15 && x < processingDimensions.width - 12 && y > 10 && y < processingDimensions.height - 18) }],
      };
    },
  };
  const result = await new SegmentationPipeline().run(provider, {
    imageBuffer: Buffer.from("fixture"), mimeType: "image/png", dimensions: { width: 1600, height: 1000 }, signal: new AbortController().signal,
  }, { debug: true });
  assert.equal(result.walls.length, 1);
  assert.equal(result.providerVersion, "benchmark-fixture-v1");
  assert.ok(result.walls[0].points.length >= 3);
  assert.ok((result.walls[0].qualityScore ?? 0) > 0.75);
  assert.ok(result.processingTimeMs < 2_000, `benchmark excedido: ${result.processingTimeMs}ms`);
  assert.equal(result.debugRegions?.length, 1);
});
