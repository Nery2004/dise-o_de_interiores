import {
  DEFAULT_PAINT_SETTINGS,
  type ResolvedPaintSettings,
} from "@/lib/paint/paintSettings";

const STORAGE_KEY = "interior-color-studio:paint-preferences:v1";

export function getStoredPaintPreferences(): ResolvedPaintSettings {
  if (typeof window === "undefined") return DEFAULT_PAINT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PAINT_SETTINGS;
    const value = JSON.parse(stored) as Partial<ResolvedPaintSettings>;
    return {
      blendMode:
        value.blendMode ?? DEFAULT_PAINT_SETTINGS.blendMode,
      edgeFeather:
        value.edgeFeather ?? DEFAULT_PAINT_SETTINGS.edgeFeather,
      paintIntensity:
        value.paintIntensity ?? DEFAULT_PAINT_SETTINGS.paintIntensity,
      paintMode: value.paintMode ?? DEFAULT_PAINT_SETTINGS.paintMode,
      primerCoverage:
        value.primerCoverage ?? DEFAULT_PAINT_SETTINGS.primerCoverage,
      renderQuality:
        value.renderQuality ?? DEFAULT_PAINT_SETTINGS.renderQuality,
    };
  } catch {
    return DEFAULT_PAINT_SETTINGS;
  }
}

export function savePaintPreferences(settings: ResolvedPaintSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
