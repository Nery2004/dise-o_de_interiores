import { hexToRgb, normalizeHex } from "@/lib/colors/colorConversion";

export function getRelativeLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function getContrastRatio(first: string, second: string) { const values = [getRelativeLuminance(first), getRelativeLuminance(second)].sort((a, b) => b - a); return (values[0] + 0.05) / (values[1] + 0.05); }
export function getRecommendedTextColor(backgroundHex: string) { return getContrastRatio(backgroundHex, "#000000") >= getContrastRatio(backgroundHex, "#FFFFFF") ? "#000000" : "#FFFFFF"; }
export function hasGoodContrast(first: string, second: string) { return Boolean(normalizeHex(first) && normalizeHex(second)) && getContrastRatio(first, second) >= 3; }
