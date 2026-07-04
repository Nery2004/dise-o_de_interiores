import type {
  WallAIProviderName,
  WallDetectionApiResponse,
  WallDetectionProvider,
  WallDetectionResult,
} from "@/lib/wallDetection/types";

type DetectWallsApiResponse = {
  walls?: unknown;
  provider?: unknown;
  error?: string;
};

const apiProviderNames = new Set<WallAIProviderName>([
  "mock",
  "replicate",
  "huggingface",
  "roboflow",
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
    (wall.confidence === undefined || typeof wall.confidence === "number")
  );
}

async function parseDetectWallsResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as DetectWallsApiResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "No se pudieron detectar paredes.");
  }

  if (!Array.isArray(payload.walls)) {
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
  } satisfies WallDetectionApiResponse;
}

export const aiWallDetectionProvider: WallDetectionProvider = {
  async detectWalls(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch("/api/detect-walls", {
        method: "POST",
        body: formData,
      });

      return parseDetectWallsResponse(response);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error("Error de red al detectar paredes.");
      }

      throw error;
    }
  },
};
