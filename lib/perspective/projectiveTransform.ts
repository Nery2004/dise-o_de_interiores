import type { ImagePoint, RenderQuality } from "@/types/editor";
import type { PerspectivePoints } from "@/types/perspective";

type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

function solveLinearSystem(matrix: number[][], values: number[]) {
  const rows = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < values.length; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < rows.length; row += 1)
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column]))
        pivot = row;
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    if (Math.abs(divisor) < 1e-9) return null;
    for (let entry = column; entry <= values.length; entry += 1)
      rows[column][entry] /= divisor;
    for (let row = 0; row < rows.length; row += 1) {
      if (row === column) continue;
      const factor = rows[row][column];
      for (let entry = column; entry <= values.length; entry += 1)
        rows[row][entry] -= factor * rows[column][entry];
    }
  }
  return rows.map((row) => row[values.length]);
}

export function computeProjectiveMatrix(
  width: number,
  height: number,
  points: PerspectivePoints,
): Matrix | null {
  const source: ImagePoint[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const destination = [
    points.topLeft,
    points.topRight,
    points.bottomRight,
    points.bottomLeft,
  ];
  const equations: number[][] = [];
  const values: number[] = [];
  source.forEach((point, index) => {
    const target = destination[index];
    equations.push([
      point.x,
      point.y,
      1,
      0,
      0,
      0,
      -target.x * point.x,
      -target.x * point.y,
    ]);
    values.push(target.x);
    equations.push([
      0,
      0,
      0,
      point.x,
      point.y,
      1,
      -target.y * point.x,
      -target.y * point.y,
    ]);
    values.push(target.y);
  });
  const solved = solveLinearSystem(equations, values);
  return solved ? ([...solved, 1] as Matrix) : null;
}

export function mapProjectivePoint(
  matrix: Matrix,
  point: ImagePoint,
): ImagePoint {
  const divisor = matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  return {
    x: (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / divisor,
    y: (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / divisor,
  };
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  source: [ImagePoint, ImagePoint, ImagePoint],
  target: [ImagePoint, ImagePoint, ImagePoint],
) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = target;
  const denominator =
    s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(denominator) < 1e-9) return;
  const a =
    (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) /
    denominator;
  const c =
    (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) /
    denominator;
  const e =
    (d0.x * (s1.x * s2.y - s2.x * s1.y) +
      d1.x * (s2.x * s0.y - s0.x * s2.y) +
      d2.x * (s0.x * s1.y - s1.x * s0.y)) /
    denominator;
  const b =
    (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) /
    denominator;
  const d =
    (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) /
    denominator;
  const f =
    (d0.y * (s1.x * s2.y - s2.x * s1.y) +
      d1.y * (s2.x * s0.y - s0.x * s2.y) +
      d2.y * (s0.x * s1.y - s1.x * s0.y)) /
    denominator;
  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.setTransform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

export function renderProjectiveImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  points: PerspectivePoints,
  quality: RenderQuality = "high",
) {
  const matrix = computeProjectiveMatrix(sourceWidth, sourceHeight, points);
  if (!matrix) return false;
  const subdivisions = quality === "draft" ? 2 : quality === "high" ? 6 : 12;
  for (let y = 0; y < subdivisions; y += 1)
    for (let x = 0; x < subdivisions; x += 1) {
      const sx0 = (sourceWidth * x) / subdivisions;
      const sx1 = (sourceWidth * (x + 1)) / subdivisions;
      const sy0 = (sourceHeight * y) / subdivisions;
      const sy1 = (sourceHeight * (y + 1)) / subdivisions;
      const s00 = { x: sx0, y: sy0 };
      const s10 = { x: sx1, y: sy0 };
      const s11 = { x: sx1, y: sy1 };
      const s01 = { x: sx0, y: sy1 };
      const d00 = mapProjectivePoint(matrix, s00);
      const d10 = mapProjectivePoint(matrix, s10);
      const d11 = mapProjectivePoint(matrix, s11);
      const d01 = mapProjectivePoint(matrix, s01);
      drawTriangle(context, image, [s00, s10, s11], [d00, d10, d11]);
      drawTriangle(context, image, [s00, s11, s01], [d00, d11, d01]);
    }
  return true;
}
