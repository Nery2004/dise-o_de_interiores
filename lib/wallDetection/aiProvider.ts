import type {
  WallAIProviderName,
  WallDetectionApiResponse,
  WallDetectionProvider,
  WallDetectionResult,
} from "@/lib/wallDetection/types";

type DetectWallsApiResponse = {
  success?: unknown;
  walls?: unknown;
  provider?: unknown;
  error?: { code?: unknown; message?: unknown };
  metrics?: unknown;
  debug?: unknown;
};

const apiProviderNames = new Set<WallAIProviderName>([
  "mock",
  "replicate",
  "huggingface",
  "roboflow",
  "sam2",
  "florence-2",
  "grounding-dino",
  "yolo-segmentation",
  "custom",
]);

function isWallDetectionResult(value: unknown): value is WallDetectionResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const wall = value as Partial<WallDetectionResult>;

  return (
    typeof wall.id === "string" &&
    typeof wall.name === "string" &&
    Array.isArray(wall.points) &&
    wall.points.every(
      (point) =>
        point &&
        typeof point === "object" &&
        typeof (point as { x?: unknown }).x === "number" &&
        typeof (point as { y?: unknown }).y === "number",
    ) &&
    (wall.confidence === undefined || typeof wall.confidence === "number") &&
    (wall.qualityScore === undefined || typeof wall.qualityScore === "number")
  );
}

async function parseDetectWallsResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as DetectWallsApiResponse;

  if (!response.ok) {
    throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "No se pudieron detectar paredes.");
  }

  if (payload.success !== true || !Array.isArray(payload.walls)) {
    throw new Error("La respuesta de detección no es válida.");
  }

  if (!payload.walls.every(isWallDetectionResult)) {
    throw new Error("La respuesta de detección no es válida.");
  }

  if (
    typeof payload.provider !== "string" ||
    !apiProviderNames.has(payload.provider as WallAIProviderName)
  ) {
    throw new Error("La respuesta de detección no es válida.");
  }

  const provider = payload.provider as WallAIProviderName;

  return {
    walls: payload.walls,
    provider,
    metrics: payload.metrics as WallDetectionApiResponse["metrics"],
    debug: payload.debug as WallDetectionApiResponse["debug"],
  } satisfies WallDetectionApiResponse;
}

export const aiWallDetectionProvider: WallDetectionProvider = {
  async detectWalls(imageFile, _imageDimensions, options) {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("provider", options?.provider ?? "ai");
    formData.append("maskSmoothness", String(options?.maskSmoothness ?? 0.45));
    formData.append("polygonTolerance", String(options?.polygonTolerance ?? 1.8));
    if (options?.debug) formData.append("debug", "true");

    try {
      const response = await fetch("/api/detect-walls", {
        method: "POST",
        body: formData,
        signal: options?.signal,
      });

      return parseDetectWallsResponse(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      if (error instanceof TypeError) {
        throw new Error("Error de red al detectar paredes.");
      }

      throw error;
    }
  },
};
