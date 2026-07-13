import { imageSize } from "image-size";
import { NextResponse } from "next/server";
import { parseProviderTimeout } from "@/lib/env/envValidation";
import { validateImageDimensions, validateImageUploadMetadata } from "@/lib/images/imageValidation";
import { serverLogger } from "@/lib/server/logger";
import { ProviderTimeoutError, runWithProviderTimeout } from "@/lib/server/providerTimeout";
import { wallDetectionRateLimiter } from "@/lib/server/rateLimit";
import { getWallAIProvider, WallAIProviderConfigurationError } from "@/lib/server/wall-ai-providers";
import { ImageHasher } from "@/lib/server/wall-detection/ImageHasher";
import { wallDetectionCache } from "@/lib/server/wall-detection/WallDetectionCache";
import { SegmentationPipeline } from "@/lib/wallDetection/pipeline/SegmentationPipeline";
import { encodeBinaryMaskRle } from "@/lib/wallDetection/pipeline/debugEncoding";
import type { WallDetectionResult } from "@/lib/wallDetection/types";
import { processingDimensions } from "@/lib/wallDetection/pipeline/SegmentationPipeline";
import { findComponents, rasterizePolygon } from "@/lib/wallDetection/pipeline/MaskOperations";
import type { SegmentationProviderOutput } from "@/lib/wallDetection/pipeline/types";
import { createWallDetectionCacheKey } from "@/lib/server/wall-detection/WallDetectionCacheKey";
import { WALL_DETECTION_PIPELINE_VERSION } from "@/lib/wallDetection/pipeline/version";
import { FeatureFlags } from "@/config/featureFlags";
import { resolveRequestedDetectionMode } from "@/lib/wallDetection/providerSelection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MULTIPART_REQUEST_BYTES = 11 * 1024 * 1024;

type ApiErrorCode = "METHOD_NOT_ALLOWED" | "RATE_LIMITED" | "INVALID_CONTENT_TYPE" | "MISSING_IMAGE" | "INVALID_IMAGE" | "IMAGE_TOO_LARGE" | "IMAGE_DIMENSIONS_EXCEEDED" | "INVALID_PROVIDER" | "PROVIDER_NOT_CONFIGURED" | "PROVIDER_TIMEOUT" | "INVALID_PROVIDER_RESPONSE" | "CANCELLED" | "INTERNAL_ERROR";

const numericOption = (value: FormDataEntryValue | null, fallback: number, minimum: number, maximum: number) => {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
};

function errorResponse(code: ApiErrorCode, message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers });
}

function clientIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown"; }

function isWallDetectionResult(value: unknown, width: number, height: number): value is WallDetectionResult {
  if (!value || typeof value !== "object") return false;
  const wall = value as Partial<WallDetectionResult>;
  const validPoint = (point: unknown) => point && typeof point === "object" && Number.isFinite((point as { x?: unknown }).x) && Number.isFinite((point as { y?: unknown }).y) && Number((point as { x: number }).x) >= 0 && Number((point as { x: number }).x) <= width && Number((point as { y: number }).y) >= 0 && Number((point as { y: number }).y) <= height;
  return typeof wall.id === "string" && typeof wall.name === "string" && Array.isArray(wall.points) && wall.points.length >= 3 && wall.points.length <= 10_000 && wall.points.every(validPoint) && (wall.exclusionPolygons === undefined || (Array.isArray(wall.exclusionPolygons) && wall.exclusionPolygons.every((polygon) => Array.isArray(polygon) && polygon.length >= 3 && polygon.every(validPoint)))) && (wall.confidence === undefined || (typeof wall.confidence === "number" && wall.confidence >= 0 && wall.confidence <= 1)) && (wall.qualityScore === undefined || (typeof wall.qualityScore === "number" && wall.qualityScore >= 0 && wall.qualityScore <= 100));
}

function parseLocalWall(value: FormDataEntryValue | null, width: number, height: number) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as Partial<WallDetectionResult>;
    if (!parsed.id || !parsed.name || !Array.isArray(parsed.points) || parsed.points.length < 3) return null;
    if (!parsed.points.every((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y) && point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height)) return null;
    return parsed as Pick<WallDetectionResult, "id" | "name" | "points" | "confidence">;
  } catch { return null; }
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

    const requestedProviderValue = formData.get("provider");
    const requestedProvider = resolveRequestedDetectionMode(requestedProviderValue, FeatureFlags.externalWallAi);
    if (!requestedProvider) return errorResponse("INVALID_PROVIDER", "El proveedor solicitado no es válido.", 400);
    const maskSmoothness = numericOption(formData.get("maskSmoothness"), 0.45, 0, 1);
    const polygonTolerance = numericOption(formData.get("polygonTolerance"), 1.8, 0.25, 8);
    const debug = process.env.NODE_ENV !== "production" && formData.get("debug") === "true";
    const localWall = formData.get("action") === "refine" ? parseLocalWall(formData.get("wall"), dimensions.width!, dimensions.height!) : null;
    if (formData.get("action") === "refine" && !localWall) return errorResponse("INVALID_PROVIDER_RESPONSE", "La pared seleccionada no es válida.", 400);
    if (!localWall && requestedProvider !== "mock" && !FeatureFlags.externalWallAi) return errorResponse("PROVIDER_NOT_CONFIGURED", "Los proveedores externos están deshabilitados en esta versión.", 503);
    const processing = processingDimensions(dimensions.width!, dimensions.height!);
    const provider = localWall ? {
      name: "custom" as const,
      version: "local-refinement-v1",
      async segmentWalls(): Promise<SegmentationProviderOutput> {
        const points = localWall.points.map((point) => ({ x: point.x * processing.width / dimensions.width!, y: point.y * processing.height / dimensions.height! }));
        return { modelVersion: this.version, regions: [{ id: localWall.id, name: localWall.name, confidence: localWall.confidence ?? 0.7, mask: rasterizePolygon(processing.width, processing.height, points) }] };
      },
    } : getWallAIProvider(requestedProvider);
    const hash = new ImageHasher().hash(buffer);
    const cacheKey = createWallDetectionCacheKey({
      imageHash: hash,
      provider: provider.name,
      providerVersion: provider.version,
      configuration: { debug, maskSmoothness, polygonTolerance },
      refinementTarget: localWall?.points ?? null,
    });
    const cached = wallDetectionCache.get(cacheKey);
    if (cached) return NextResponse.json({ success: true, ...cached, metrics: cached.metrics ? { ...cached.metrics, cacheHit: true } : undefined }, { headers: { "X-RateLimit-Remaining": String(rateLimit.remaining), "Cache-Control": "no-store" } });
    const timeoutMs = parseProviderTimeout(process.env.WALL_AI_TIMEOUT_MS);
    const pipeline = new SegmentationPipeline();
    const result = await runWithProviderTimeout(timeoutMs, (signal) => pipeline.run(provider, { imageBuffer: buffer, mimeType: image.type, dimensions: { width: dimensions.width!, height: dimensions.height! }, signal }, { maskSmoothness, polygonTolerance, debug }), request.signal);
    const walls = result.walls;
    if (!Array.isArray(walls) || !walls.every((wall) => isWallDetectionResult(wall, dimensions.width!, dimensions.height!))) return errorResponse("INVALID_PROVIDER_RESPONSE", "El proveedor devolvió una respuesta inválida.", 502);

    const response = {
      walls,
      provider: provider.name,
      metrics: { pipelineVersion: WALL_DETECTION_PIPELINE_VERSION, providerVersion: result.providerVersion, processingTimeMs: result.processingTimeMs, wallCount: walls.length, averageQualityScore: result.averageQualityScore, cacheHit: false, refinementCount: walls.reduce((sum, wall) => sum + (wall.refinement?.refinementCount ?? 0), 0) },
      debug: debug && result.debugRegions ? { pipelineVersion: WALL_DETECTION_PIPELINE_VERSION, parameters: { maskSmoothness, polygonTolerance, binaryInput: true as const }, regions: result.debugRegions.map((region) => ({ id: region.id, width: region.mask.width, height: region.mask.height, binaryMaskRle: encodeBinaryMaskRle(region.mask), contour: region.contour, polygon: region.polygon, refined: region.refined, confidence: region.confidence, qualityScore: region.qualityScore, qualityBreakdown: region.qualityBreakdown, issues: region.issues, stageTimings: region.stageTimings, appliedStages: region.appliedStages, retryCount: region.retryCount, componentCount: findComponents(region.mask).length, stageMasksRle: { original: encodeBinaryMaskRle(region.trace.original), cleaned: encodeBinaryMaskRle(region.trace.cleaned), corrected: encodeBinaryMaskRle(region.trace.corrected), final: encodeBinaryMaskRle(region.trace.final), stages: Object.fromEntries(Object.entries(region.trace.stageMasks).map(([stage, mask]) => [stage, encodeBinaryMaskRle(mask)])) } })) } : undefined,
    };
    wallDetectionCache.set(cacheKey, response);
    serverLogger.info("Wall detection completed", { provider: provider.name, version: result.providerVersion, width: dimensions.width, height: dimensions.height, walls: walls.length, processingTimeMs: result.processingTimeMs });
    return NextResponse.json({ success: true, ...response }, { headers: { "X-RateLimit-Remaining": String(rateLimit.remaining), "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WallAIProviderConfigurationError) return errorResponse("PROVIDER_NOT_CONFIGURED", error.message, 503);
    if (error instanceof ProviderTimeoutError) return errorResponse("PROVIDER_TIMEOUT", error.message, 504);
    if (error instanceof DOMException && error.name === "AbortError") return errorResponse("CANCELLED", "La detección fue cancelada.", 499);
    serverLogger.error("Wall detection failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("INTERNAL_ERROR", "No se pudo procesar la imagen.", 500);
  }
}
