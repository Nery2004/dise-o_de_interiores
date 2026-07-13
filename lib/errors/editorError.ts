export type EditorErrorCode =
  | "IMAGE_LOAD_FAILED"
  | "INVALID_PROJECT"
  | "EXPORT_FAILED"
  | "EXPORT_TOO_LARGE"
  | "ASSET_LOAD_FAILED"
  | "MASK_PROCESSING_FAILED"
  | "STORAGE_QUOTA_EXCEEDED"
  | "AI_PROVIDER_UNAVAILABLE";

const messages: Record<EditorErrorCode, string> = {
  IMAGE_LOAD_FAILED: "No se pudo cargar la imagen.",
  INVALID_PROJECT: "El archivo del proyecto no es válido.",
  EXPORT_FAILED: "No se pudo exportar la imagen.",
  EXPORT_TOO_LARGE: "La imagen supera el límite seguro de exportación de este dispositivo.",
  ASSET_LOAD_FAILED: "No se pudo cargar uno de los objetos.",
  MASK_PROCESSING_FAILED: "No se pudo procesar la pared.",
  STORAGE_QUOTA_EXCEEDED: "No hay espacio suficiente para guardar este proyecto.",
  AI_PROVIDER_UNAVAILABLE: "La detección automática no está disponible en este momento.",
};

export class EditorError extends Error {
  constructor(
    public readonly code: EditorErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "EditorError";
  }
}

export function getEditorErrorMessage(error: unknown, fallback: string) {
  if (error instanceof EditorError) return messages[error.code];
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return messages.STORAGE_QUOTA_EXCEEDED;
  return fallback;
}
