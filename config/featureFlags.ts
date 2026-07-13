export function parseFeatureFlag(value: string | undefined, fallback: boolean) {
  const normalized = value?.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized ?? "")) return true;
  if (["0", "false", "no", "off"].includes(normalized ?? "")) return false;
  return fallback;
}

export const FeatureFlags = Object.freeze({
  externalWallAi: parseFeatureFlag(
    process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_WALL_AI,
    false,
  ),
  advancedPerspective: parseFeatureFlag(
    process.env.NEXT_PUBLIC_ENABLE_ADVANCED_PERSPECTIVE,
    true,
  ),
  automaticLighting: parseFeatureFlag(
    process.env.NEXT_PUBLIC_ENABLE_AUTOMATIC_LIGHTING,
    false,
  ),
  objectOcclusion: false,
  developerTools: process.env.NODE_ENV !== "production",
  debugBenchmarks: process.env.NODE_ENV !== "production",
});
