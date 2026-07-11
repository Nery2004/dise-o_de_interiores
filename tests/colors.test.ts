import assert from "node:assert/strict";
import test from "node:test";
import { hexToHsl, hexToRgb, hslToHex, normalizeHex, rgbToHex } from "@/lib/colors/colorConversion";

test("normaliza y valida códigos HEX", () => {
  assert.equal(normalizeHex("a8b5a2"), "#A8B5A2");
  assert.equal(normalizeHex("#abc"), "#AABBCC");
  assert.equal(normalizeHex("#xyzxyz"), null);
});

test("convierte HEX, RGB y HSL de forma consistente", () => {
  assert.deepEqual(hexToRgb("#A8B5A2"), { r: 168, g: 181, b: 162 });
  assert.equal(rgbToHex(168, 181, 162), "#A8B5A2");
  const hsl = hexToHsl("#A8B5A2");
  assert.ok(hsl);
  const roundTrip = hslToHex(hsl.h, hsl.s, hsl.l);
  assert.ok(roundTrip && hexToRgb(roundTrip));
});
