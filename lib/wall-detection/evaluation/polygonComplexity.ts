import type { WallDetectionPoint } from "@/lib/wallDetection/types";

export type PolygonComplexityMetrics = {
  pointCount: number;
  area: number;
  perimeter: number;
  compactness: number;
  shortSegmentRatio: number;
  sharpTurnRatio: number;
  zigzagRatio: number;
  polygonComplexityScore: number;
};

function polygonArea(points: WallDetectionPoint[]) {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2);
}

function turnAt(points: WallDetectionPoint[], index: number) {
  const previous = points[(index - 1 + points.length) % points.length];
  const current = points[index];
  const next = points[(index + 1) % points.length];
  const first = Math.atan2(current.y - previous.y, current.x - previous.x);
  const second = Math.atan2(next.y - current.y, next.x - current.x);
  let turn = second - first;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  return turn;
}

export function calculatePolygonComplexity(
  points: WallDetectionPoint[],
  imageWidth: number,
  imageHeight: number,
): PolygonComplexityMetrics {
  if (points.length < 3)
    return { pointCount: points.length, area: 0, perimeter: 0, compactness: 0, shortSegmentRatio: 1, sharpTurnRatio: 1, zigzagRatio: 1, polygonComplexityScore: 100 };
  const lengths = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  const perimeter = lengths.reduce((sum, length) => sum + length, 0);
  const area = polygonArea(points);
  const diagonal = Math.max(1, Math.hypot(imageWidth, imageHeight));
  const turns = points.map((_, index) => turnAt(points, index));
  const shortSegmentRatio = lengths.filter((length) => length < diagonal * 0.008).length / lengths.length;
  const sharpTurnRatio = turns.filter((turn) => Math.abs(turn) > Math.PI * 0.88).length / turns.length;
  let alternations = 0;
  for (let index = 1; index < turns.length; index += 1)
    if (Math.sign(turns[index]) !== Math.sign(turns[index - 1]) && Math.abs(turns[index]) > 0.12 && Math.abs(turns[index - 1]) > 0.12)
      alternations += 1;
  const zigzagRatio = turns.length > 1 ? alternations / (turns.length - 1) : 0;
  const pointPenalty = Math.min(1, Math.max(0, points.length - 8) / 32);
  const polygonComplexityScore = Math.min(100, (
    pointPenalty * 0.35 +
    shortSegmentRatio * 0.25 +
    sharpTurnRatio * 0.2 +
    zigzagRatio * 0.2
  ) * 100);
  return {
    pointCount: points.length,
    area,
    perimeter,
    compactness: perimeter ? Math.min(1, 4 * Math.PI * area / (perimeter * perimeter)) : 0,
    shortSegmentRatio,
    sharpTurnRatio,
    zigzagRatio,
    polygonComplexityScore,
  };
}
