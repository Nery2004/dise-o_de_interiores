import { imageSize } from "image-size";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env/serverEnv";
import { validateImageDimensions, validateImageUploadMetadata } from "@/lib/images/imageValidation";
import { serverLogger } from "@/lib/server/logger";
import { ProviderTimeoutError, runWithProviderTimeout } from "@/lib/server/providerTimeout";
import { wallDetectionRateLimiter } from "@/lib/server/rateLimit";
import { getWallAIProvider, WallAIProviderConfigurationError } from "@/lib/server/wall-ai-providers";
import type { WallDetectionResult } from "@/lib/wallDetection/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MULTIPART_REQUEST_BYTES = 11 * 1024 * 1024;

type ApiErrorCode = "METHOD_NOT_ALLOWED" | "RATE_LIMITED" | "INVALID_CONTENT_TYPE" | "MISSING_IMAGE" | "INVALID_IMAGE" | "IMAGE_TOO_LARGE" | "IMAGE_DIMENSIONS_EXCEEDED" | "PROVIDER_NOT_CONFIGURED" | "PROVIDER_TIMEOUT" | "INVALID_PROVIDER_RESPONSE" | "INTERNAL_ERROR";

function errorResponse(code: ApiErrorCode, message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers });
}

function clientIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown"; }

function isWallDetectionResult(value: unknown, width: number, height: number): value is WallDetectionResult {
  if (!value || typeof value !== "object") return false;
  const wall = value as Partial<WallDetectionResult>;
  return typeof wall.id === "string" && typeof wall.name === "string" && Array.isArray(wall.points) && wall.points.length >= 3 && wall.points.length <= 10_000 && wall.points.every((point) => point && typeof point === "object" && Number.isFinite((point as { x?: unknown }).x) && Number.isFinite((point as { y?: unknown }).y) && Number((point as { x: number }).x) >= 0 && Number((point as { x: number }).x) <= width && Number((point as { y: number }).y) >= 0 && Number((point as { y: number }).y) <= height) && (wall.confidence === undefined || (typeof wall.confidence === "number" && wall.confidence >= 0 && wall.confidence <= 1));
}

export function GET() { return errorResponse("METHOD_NOT_ALLOWED", "Método no permitido.", 405, { Allow: "POST" }); }

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rateLimit = await wallDetectionRateLimiter.check(ip);
  if (!rateLimit.allowed) return errorResponse("RATE_LIMITED", "Has realizado demasiadas solicitudes. Intenta nuevamente más tarde.", 429, { "Retry-After": String(rateLimit.retryAfterSeconds), "X-RateLimit-Remaining": "0" });

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data")) return errorResponse("INVALID_CONTENT_TYPE", "La solicitud debe usar multipart/form-data.", 415);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_REQUEST_BYTES) {
    return errorResponse("IMAGE_TOO_LARGE", "La imagen no puede superar los 10 MB.", 413);
  }

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return errorResponse("INVALID_CONTENT_TYPE", "No se pudo leer el formulario enviado.", 400); }
  const image = formData.get("image");
  if (!(image instanceof File)) return errorResponse("MISSING_IMAGE", "Debes enviar una imagen en el campo image.", 400);

  const metadataValidation = validateImageUploadMetadata(image);
  if (!metadataValidation.valid) {
    const status = metadataValidation.code === "FILE_TOO_LARGE" ? 413 : metadataValidation.code === "INVALID_TYPE" ? 415 : 400;
    return errorResponse(metadataValidation.code === "FILE_TOO_LARGE" ? "IMAGE_TOO_LARGE" : "INVALID_IMAGE", metadataValidation.message, status);
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    const dimensions = imageSize(buffer);
    if (!dimensions.width || !dimensions.height || !validateImageDimensions(dimensions.width, dimensions.height)) return errorResponse("IMAGE_DIMENSIONS_EXCEEDED", "La imagen supera el límite permitido de 25 megapíxeles o 10 000 píxeles por lado.", 413);
    const detectedMime = dimensions.type === "jpg" ? "image/jpeg" : dimensions.type === "png" ? "image/png" : dimensions.type === "webp" ? "image/webp" : null;
    if (!detectedMime || detectedMime !== image.type) return errorResponse("INVALID_IMAGE", "El contenido del archivo no coincide con un formato de imagen permitido.", 400);

    const provider = getWallAIProvider();
    const timeoutMs = getServerEnv().wallAITimeoutMs;
    const walls = await runWithProviderTimeout(timeoutMs, (signal) => provider.detectWalls({ imageBuffer: buffer, mimeType: image.type, dimensions: { width: dimensions.width!, height: dimensions.height! }, signal }));
    if (!Array.isArray(walls) || !walls.every((wall) => isWallDetectionResult(wall, dimensions.width!, dimensions.height!))) return errorResponse("INVALID_PROVIDER_RESPONSE", "El proveedor devolvió una respuesta inválida.", 502);

    serverLogger.info("Wall detection completed", { provider: provider.name, width: dimensions.width, height: dimensions.height, walls: walls.length });
    return NextResponse.json({ success: true, walls, provider: provider.name }, { headers: { "X-RateLimit-Remaining": String(rateLimit.remaining), "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WallAIProviderConfigurationError) return errorResponse("PROVIDER_NOT_CONFIGURED", error.message, 503);
    if (error instanceof ProviderTimeoutError) return errorResponse("PROVIDER_TIMEOUT", error.message, 504);
    serverLogger.error("Wall detection failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("INTERNAL_ERROR", "No se pudo procesar la imagen.", 500);
  }
}
