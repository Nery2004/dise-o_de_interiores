import assert from "node:assert/strict";
import test from "node:test";
import { clampPointToImage, findNearestPolygonEdge, hasMinimumPolygonPoints, insertPointBetween, movePolygonWithinImage } from "@/lib/geometry/maskGeometry";

const dimensions = { width: 100, height: 80 };
const square = [{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 70 }, { x: 10, y: 70 }];

test("limita puntos y polígonos a las dimensiones de imagen", () => {
  assert.deepEqual(clampPointToImage({ x: -5, y: 100 }, dimensions), { x: 0, y: 80 });
  const moved = movePolygonWithinImage(square, { x: 50, y: 50 }, dimensions);
  assert.equal(Math.max(...moved.map((point) => point.x)), 100);
  assert.equal(Math.max(...moved.map((point) => point.y)), 80);
});

test("encuentra aristas e inserta vértices manteniendo un polígono válido", () => {
  const edge = findNearestPolygonEdge(square, { x: 50, y: 12 });
  assert.equal(edge?.startIndex, 0);
  const points = insertPointBetween(square, 0, { x: 50, y: 10 });
  assert.equal(points.length, 5);
  assert.equal(hasMinimumPolygonPoints(points), true);
  assert.equal(hasMinimumPolygonPoints(points.slice(0, 2)), false);
});
