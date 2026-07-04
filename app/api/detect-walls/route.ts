import { imageSize } from "image-size";
import { NextResponse } from "next/server";
import {
  getWallAIProvider,
  WallAIProviderConfigurationError,
} from "@/lib/server/wall-ai-providers";
import type { WallDetectionResult } from "@/lib/wallDetection/types";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isWallDetectionResult(value: unknown): value is WallDetectionResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const wall = value as Partial<WallDetectionResult>;

  return (
    typeof wall.id === "string" &&
    typeof wall.name === "string" &&
    Array.isArray(wall.points) &&
    wall.points.length >= 3 &&
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

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("La solicitud debe usar multipart/form-data.", 400);
  }

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return errorResponse("Debes enviar una imagen en el campo image.", 400);
  }

  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return errorResponse(
      "Formato inválido. Usa PNG, JPEG o WebP.",
      415,
    );
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return errorResponse("La imagen no debe superar 10 MB.", 413);
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    const dimensions = imageSize(buffer);

    if (!dimensions.width || !dimensions.height) {
      return errorResponse("No se pudieron leer las dimensiones.", 400);
    }

    const provider = getWallAIProvider();
    const walls = await provider.detectWalls({
      imageBuffer: buffer,
      mimeType: image.type,
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
      },
    });

    if (!Array.isArray(walls) || !walls.every(isWallDetectionResult)) {
      return errorResponse("El proveedor devolvió una respuesta inválida.", 502);
    }

    return NextResponse.json({ walls, provider: provider.name });
  } catch (error) {
    if (error instanceof WallAIProviderConfigurationError) {
      return errorResponse(error.message, 503);
    }

    return errorResponse("No se pudo procesar la imagen.", 500);
  }
}
