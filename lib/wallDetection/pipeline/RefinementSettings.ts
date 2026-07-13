export type RefinementStageSettings = {
  edgeAlignment: boolean;
  perspectiveCorrection: boolean;
  gapFilling: boolean;
  holeRemoval: boolean;
  noiseRemoval: boolean;
  boundaryOptimization: boolean;
  cornerSnap: boolean;
  polygonOptimization: boolean;
};

export type RefinementSettings = {
  edgeTolerance: number;
  cornerSnapDistance: number;
  noiseThreshold: number;
  holeThreshold: number;
  polygonTolerance: number;
  featherStrength: number;
  qualityThreshold: number;
  maxBoundaryDisplacement: number;
  stages: RefinementStageSettings;
};

export type RefinementSettingsInput = Partial<Omit<RefinementSettings, "stages">> & {
  stages?: Partial<RefinementStageSettings>;
};

export const DEFAULT_REFINEMENT_SETTINGS: RefinementSettings = {
  edgeTolerance: 6,
  cornerSnapDistance: 8,
  noiseThreshold: 0.001,
  holeThreshold: 0.008,
  polygonTolerance: 1.8,
  featherStrength: 0.55,
  qualityThreshold: 68,
  maxBoundaryDisplacement: 8,
  stages: {
    edgeAlignment: true,
    perspectiveCorrection: true,
    gapFilling: false,
    holeRemoval: true,
    noiseRemoval: true,
    boundaryOptimization: true,
    cornerSnap: true,
    polygonOptimization: true,
  },
};

export function resolveRefinementSettings(
  settings: RefinementSettingsInput = {},
): RefinementSettings {
  return {
    ...DEFAULT_REFINEMENT_SETTINGS,
    ...settings,
    stages: { ...DEFAULT_REFINEMENT_SETTINGS.stages, ...settings.stages },
  };
}

export function conservativeRefinementSettings(settings: RefinementSettings): RefinementSettings {
  return {
    ...settings,
    edgeTolerance: Math.max(2, settings.edgeTolerance * 0.55),
    cornerSnapDistance: Math.max(2, settings.cornerSnapDistance * 0.6),
    featherStrength: Math.min(settings.featherStrength, 0.35),
    maxBoundaryDisplacement: Math.max(2, settings.maxBoundaryDisplacement * 0.55),
  };
}
