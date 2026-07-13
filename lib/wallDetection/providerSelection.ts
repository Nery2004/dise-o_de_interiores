import type { WallDetectionMode } from "@/lib/wallDetection/types";

const selectableProviders = new Set<WallDetectionMode>([
  "mock",
  "ai",
  "sam2",
  "florence-2",
  "grounding-dino",
  "roboflow",
  "yolo-segmentation",
  "custom",
]);

export function resolveRequestedDetectionMode(
  value: FormDataEntryValue | null,
  externalEnabled: boolean,
) {
  if (value === null) return externalEnabled ? "ai" : "mock";
  if (typeof value !== "string") return null;
  return selectableProviders.has(value as WallDetectionMode)
    ? (value as WallDetectionMode)
    : null;
}
