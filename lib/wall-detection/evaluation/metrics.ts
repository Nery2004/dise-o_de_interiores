import type { BinaryMask } from "@/lib/wallDetection/pipeline/types";

export type BinaryConfusionMatrix = {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
};

export type BinaryMaskMetrics = BinaryConfusionMatrix & {
  intersectionOverUnion: number;
  diceCoefficient: number;
  precision: number;
  recall: number;
  f1Score: number;
  pixelAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
};

export function assertCompatibleMasks(first: BinaryMask, second: BinaryMask) {
  if (
    first.width !== second.width ||
    first.height !== second.height ||
    first.data.length !== first.width * first.height ||
    second.data.length !== second.width * second.height
  )
    throw new Error("Las máscaras binarias deben tener las mismas dimensiones.");
}

export function binaryConfusionMatrix(
  predicted: BinaryMask,
  expected: BinaryMask,
): BinaryConfusionMatrix {
  assertCompatibleMasks(predicted, expected);
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  for (let index = 0; index < predicted.data.length; index += 1) {
    const prediction = predicted.data[index] > 0;
    const truth = expected.data[index] > 0;
    if (prediction && truth) truePositive += 1;
    else if (prediction) falsePositive += 1;
    else if (truth) falseNegative += 1;
    else trueNegative += 1;
  }
  return { truePositive, trueNegative, falsePositive, falseNegative };
}

function safeRatio(numerator: number, denominator: number, emptyValue: number) {
  return denominator > 0 ? numerator / denominator : emptyValue;
}

export function calculateBinaryMaskMetrics(
  predicted: BinaryMask,
  expected: BinaryMask,
): BinaryMaskMetrics {
  const matrix = binaryConfusionMatrix(predicted, expected);
  const { truePositive, trueNegative, falsePositive, falseNegative } = matrix;
  const bothEmpty = truePositive + falsePositive + falseNegative === 0;
  const precision = safeRatio(truePositive, truePositive + falsePositive, bothEmpty ? 1 : 0);
  const recall = safeRatio(truePositive, truePositive + falseNegative, bothEmpty ? 1 : 0);
  const dice = safeRatio(2 * truePositive, 2 * truePositive + falsePositive + falseNegative, bothEmpty ? 1 : 0);
  return {
    ...matrix,
    intersectionOverUnion: safeRatio(truePositive, truePositive + falsePositive + falseNegative, bothEmpty ? 1 : 0),
    diceCoefficient: dice,
    precision,
    recall,
    f1Score: safeRatio(2 * precision * recall, precision + recall, bothEmpty ? 1 : 0),
    pixelAccuracy: safeRatio(truePositive + trueNegative, predicted.data.length, 1),
    falsePositiveRate: safeRatio(falsePositive, falsePositive + trueNegative, 0),
    falseNegativeRate: safeRatio(falseNegative, falseNegative + truePositive, 0),
  };
}

export function unionMasks(masks: BinaryMask[]): BinaryMask {
  if (!masks.length) throw new Error("Se necesita al menos una máscara para calcular la unión.");
  const [first, ...rest] = masks;
  const data = Uint8Array.from(first.data, (value) => value > 0 ? 1 : 0);
  for (const mask of rest) {
    assertCompatibleMasks(first, mask);
    for (let index = 0; index < data.length; index += 1)
      if (mask.data[index]) data[index] = 1;
  }
  return { width: first.width, height: first.height, data };
}
