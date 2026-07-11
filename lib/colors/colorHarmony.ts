import { hexToHsl, hslToHex, normalizeHex } from "@/lib/colors/colorConversion";

function rotate(hex: string, degrees: number) { const hsl = hexToHsl(hex); return hsl ? hslToHex(hsl.h + degrees, hsl.s, hsl.l)! : "#000000"; }
export function getComplementaryColor(hex: string) { return rotate(hex, 180); }
export function getAnalogousColors(hex: string) { return [rotate(hex, -30), normalizeHex(hex) ?? "#000000", rotate(hex, 30)]; }
export function getTriadicColors(hex: string) { return [normalizeHex(hex) ?? "#000000", rotate(hex, 120), rotate(hex, 240)]; }
export function getSplitComplementaryColors(hex: string) { return [normalizeHex(hex) ?? "#000000", rotate(hex, 150), rotate(hex, 210)]; }
export function getMonochromaticColors(hex: string) { const hsl = hexToHsl(hex); return hsl ? [20, 35, 50, 65, 80].map((lightness) => hslToHex(hsl.h, hsl.s, lightness)!) : []; }
