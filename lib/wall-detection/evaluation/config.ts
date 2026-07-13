export type WallQualityScoreConfig = {
  iou: number;
  dice: number;
  boundaryIou: number;
  precision: number;
  recall: number;
  fragmentation: number;
  polygonSimplicity: number;
};

export type WallDetectionEvaluationConfig = {
  binaryThreshold: number;
  boundaryTolerances: readonly number[];
  qualityWeights: WallQualityScoreConfig;
  minimumComponentRatio: number;
  noiseThresholdRatio: number;
  holeThresholdRatio: number;
  polygonSimplificationTolerance: number;
  maximumFixtureDimension: number;
  timeoutMs: number;
  morphology: {
    kernelRatio: number;
    minimumRadius: number;
    maximumRadius: number;
  };
  acceptance: {
    meanIou: number;
    meanDice: number;
    meanBoundaryIou: number;
    minimumPrecision: number;
    minimumRecall: number;
    maximumExclusionLeakage: number;
    maximumPostprocessingMs: number;
  };
  regression: {
    maximumIouDrop: number;
    maximumLeakageIncrease: number;
    maximumRuntimeIncreaseRatio: number;
    maximumQualityDrop: number;
  };
};

export const DEFAULT_WALL_DETECTION_EVALUATION_CONFIG: WallDetectionEvaluationConfig = {
  binaryThreshold: 0.5,
  boundaryTolerances: [1, 3, 5, 10],
  qualityWeights: {
    iou: 0.3,
    dice: 0.15,
    boundaryIou: 0.15,
    precision: 0.1,
    recall: 0.1,
    fragmentation: 0.1,
    polygonSimplicity: 0.1,
  },
  minimumComponentRatio: 0.002,
  noiseThresholdRatio: 0.001,
  holeThresholdRatio: 0.008,
  polygonSimplificationTolerance: 1.8,
  maximumFixtureDimension: 1024,
  timeoutMs: 15_000,
  morphology: {
    kernelRatio: 0.003,
    minimumRadius: 1,
    maximumRadius: 5,
  },
  acceptance: {
    meanIou: 0.8,
    meanDice: 0.88,
    meanBoundaryIou: 0.7,
    minimumPrecision: 0.85,
    minimumRecall: 0.85,
    maximumExclusionLeakage: 0.05,
    maximumPostprocessingMs: 500,
  },
  regression: {
    maximumIouDrop: 0.015,
    maximumLeakageIncrease: 0.01,
    maximumRuntimeIncreaseRatio: 0.25,
    maximumQualityDrop: 1.5,
  },
};

export function getMorphologyKernelSize(
  imageWidth: number,
  imageHeight: number,
  config = DEFAULT_WALL_DETECTION_EVALUATION_CONFIG.morphology,
) {
  const relative = Math.round(Math.max(imageWidth, imageHeight) * config.kernelRatio);
  return Math.max(config.minimumRadius, Math.min(config.maximumRadius, relative));
}
