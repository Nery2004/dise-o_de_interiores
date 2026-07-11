export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export const MAX_IMAGE_DIMENSION = 10_000;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const extensionsByType: Record<(typeof ALLOWED_IMAGE_TYPES)[number], Set<string>> = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
};

export type ImageUploadErrorCode = "EMPTY_FILE" | "INVALID_TYPE" | "INVALID_EXTENSION" | "FILE_TOO_LARGE";

export function validateImageUploadMetadata(input: { name: string; type: string; size: number }): { valid: true } | { valid: false; code: ImageUploadErrorCode; message: string } {
  if (!Number.isFinite(input.size) || input.size <= 0) return { valid: false, code: "EMPTY_FILE", message: "La imagen está vacía." };
  if (!ALLOWED_IMAGE_TYPES.includes(input.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return { valid: false, code: "INVALID_TYPE", message: "Formato inválido. Usa PNG, JPEG o WebP." };
  const extension = input.name.split(".").pop()?.toLowerCase();
  if (!extension || !extensionsByType[input.type as keyof typeof extensionsByType].has(extension)) return { valid: false, code: "INVALID_EXTENSION", message: "La extensión del archivo no coincide con su formato." };
  if (input.size > MAX_IMAGE_UPLOAD_BYTES) return { valid: false, code: "FILE_TOO_LARGE", message: "La imagen no debe superar 10 MB." };
  return { valid: true };
}

export function validateImageDimensions(width: number, height: number) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION && width * height <= MAX_IMAGE_PIXELS;
}
