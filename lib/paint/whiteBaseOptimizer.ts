import { WHITE_BASE_ANALYSIS_VERSION, type WallColorAnalysis } from "@/lib/paint/wallColorAnalyzer";
import type { WallColorProfile, WhiteBaseSettings } from "@/types/editor";

function clampSetting(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export type WhiteBaseRecommendation = Pick<
  WhiteBaseSettings,
  | "neutralizationStrength"
  | "saturationReduction"
  | "warmthCorrection"
  | "baseBrightness"
  | "baseContrast"
  | "shadowPreservation"
  | "texturePreservation"
> & { primerCoverage: number };

export type EffectiveWhiteBaseSettings = WhiteBaseRecommendation & {
  mode: "auto" | "manual";
};

export const DEFAULT_WHITE_BASE_SETTINGS: WhiteBaseSettings = {
  mode: "auto",
  analysisVersion: WHITE_BASE_ANALYSIS_VERSION,
  neutralizationStrength: 70,
  saturationReduction: 70,
  warmthCorrection: 0,
  baseBrightness: 30,
  baseContrast: 0,
  shadowPreservation: 90,
  texturePreservation: 90,
};

const RECOMMENDATIONS: Record<WallColorProfile, WhiteBaseRecommendation> = {
  "neutral-light": {
    neutralizationStrength: 35,
    saturationReduction: 35,
    warmthCorrection: 0,
    baseBrightness: 12,
    baseContrast: 0,
    shadowPreservation: 94,
    texturePreservation: 95,
    primerCoverage: 55,
  },
  "neutral-dark": {
    neutralizationStrength: 58,
    saturationReduction: 50,
    warmthCorrection: 0,
    baseBrightness: 58,
    baseContrast: 6,
    shadowPreservation: 96,
    texturePreservation: 92,
    primerCoverage: 78,
  },
  "warm-light": {
    neutralizationStrength: 68,
    saturationReduction: 72,
    warmthCorrection: -35,
    baseBrightness: 24,
    baseContrast: 0,
    shadowPreservation: 93,
    texturePreservation: 93,
    primerCoverage: 80,
  },
  "warm-dark": {
    neutralizationStrength: 80,
    saturationReduction: 78,
    warmthCorrection: -32,
    baseBrightness: 60,
    baseContrast: 8,
    shadowPreservation: 96,
    texturePreservation: 91,
    primerCoverage: 90,
  },
  "cool-light": {
    neutralizationStrength: 66,
    saturationReduction: 70,
    warmthCorrection: 24,
    baseBrightness: 22,
    baseContrast: 0,
    shadowPreservation: 93,
    texturePreservation: 93,
    primerCoverage: 78,
  },
  "cool-dark": {
    neutralizationStrength: 79,
    saturationReduction: 78,
    warmthCorrection: 28,
    baseBrightness: 60,
    baseContrast: 8,
    shadowPreservation: 96,
    texturePreservation: 91,
    primerCoverage: 90,
  },
  saturated: {
    neutralizationStrength: 92,
    saturationReduction: 94,
    warmthCorrection: 0,
    baseBrightness: 44,
    baseContrast: 4,
    shadowPreservation: 94,
    texturePreservation: 90,
    primerCoverage: 96,
  },
  unknown: {
    neutralizationStrength: 70,
    saturationReduction: 70,
    warmthCorrection: 0,
    baseBrightness: 30,
    baseContrast: 0,
    shadowPreservation: 90,
    texturePreservation: 90,
    primerCoverage: 80,
  },
};

export function getRecommendedWhiteBaseSettings(
  analysis: Pick<
    WallColorAnalysis,
    "profile" | "averageLuminance" | "dominantHue"
  >,
): WhiteBaseRecommendation {
  const base = RECOMMENDATIONS[analysis.profile];
  if (analysis.profile !== "saturated") return { ...base };
  const hue = analysis.dominantHue;
  const warmthCorrection =
    hue === undefined ? 0 : hue <= 85 || hue >= 330 ? -40 : 28;
  return {
    ...base,
    warmthCorrection,
    baseBrightness:
      analysis.averageLuminance < 0.55 ? 62 : base.baseBrightness,
  };
}

export function resolveEffectiveWhiteBaseSettings(
  settings: WhiteBaseSettings | undefined,
  analysis: Pick<
    WallColorAnalysis,
    "profile" | "averageLuminance" | "dominantHue"
  > | null,
  primerCoverage: number,
): EffectiveWhiteBaseSettings {
  const resolved = clampWhiteBaseSettings({
    ...DEFAULT_WHITE_BASE_SETTINGS,
    ...settings,
  });
  if (resolved.mode === "manual") {
    return {
      mode: "manual",
      neutralizationStrength: resolved.neutralizationStrength,
      saturationReduction: resolved.saturationReduction,
      warmthCorrection: resolved.warmthCorrection,
      baseBrightness: resolved.baseBrightness,
      baseContrast: resolved.baseContrast,
      shadowPreservation: resolved.shadowPreservation,
      texturePreservation: resolved.texturePreservation,
      primerCoverage,
    };
  }
  const recommendation = analysis
    ? getRecommendedWhiteBaseSettings(analysis)
    : RECOMMENDATIONS.unknown;
  return {
    mode: "auto",
    ...recommendation,
    primerCoverage:
      (recommendation.primerCoverage * clampSetting(primerCoverage, 0, 100)) /
      100,
  };
}

export function clampWhiteBaseSettings(
  settings: WhiteBaseSettings,
): WhiteBaseSettings {
  return {
    ...settings,
    neutralizationStrength: clampSetting(
      settings.neutralizationStrength,
      0,
      100,
    ),
    saturationReduction: clampSetting(settings.saturationReduction, 0, 100),
    warmthCorrection: clampSetting(settings.warmthCorrection, -100, 100),
    baseBrightness: clampSetting(settings.baseBrightness, 0, 100),
    baseContrast: clampSetting(settings.baseContrast, -50, 50),
    shadowPreservation: clampSetting(settings.shadowPreservation, 0, 100),
    texturePreservation: clampSetting(settings.texturePreservation, 0, 100),
  };
}

export function getNeutralizationLabel(strength: number) {
  if (strength < 45) return "Suave";
  if (strength < 75) return "Media";
  return "Alta";
}
