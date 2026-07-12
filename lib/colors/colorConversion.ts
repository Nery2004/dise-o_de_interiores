import {
  hslToRgbColor,
  rgbColorToHex,
  rgbToHslColor,
} from "@/lib/colors/colorSpace";

export function normalizeHex(hex: string) {
  const value = hex.trim().replace(/^#/, "");
  const expanded =
    value.length === 3
      ? value.split("").map((character) => character.repeat(2)).join("")
      : value;
  return /^[0-9a-f]{6}$/i.test(expanded)
    ? `#${expanded.toUpperCase()}`
    : null;
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = Number.parseInt(normalized.slice(1), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number) {
  if (
    ![r, g, b].every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 255,
    )
  ) {
    return null;
  }
  return rgbColorToHex({ r: r / 255, g: g / 255, b: b / 255 });
}

export function rgbToHsl(r: number, g: number, b: number) {
  const color = rgbToHslColor({ r: r / 255, g: g / 255, b: b / 255 });
  return {
    h: Math.round(color.h),
    s: Math.round(color.s * 100),
    l: Math.round(color.l * 100),
  };
}

export function hexToHsl(hex: string) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
}

export function hslToRgb(h: number, s: number, l: number) {
  if (
    ![h, s, l].every(Number.isFinite) ||
    h < 0 ||
    h > 360 ||
    s < 0 ||
    s > 100 ||
    l < 0 ||
    l > 100
  ) {
    return null;
  }
  const color = hslToRgbColor({ h, s: s / 100, l: l / 100 });
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
  };
}

export function hslToHex(h: number, s: number, l: number) {
  const rgb = hslToRgb(((h % 360) + 360) % 360, s, l);
  return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : null;
}

export function colorsEqual(first: string, second: string) {
  return normalizeHex(first) === normalizeHex(second);
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
