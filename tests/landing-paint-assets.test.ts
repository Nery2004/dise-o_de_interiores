import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  getLandingRoomImage,
  LANDING_ROOM_BASE_IMAGE,
} from "@/data/landingRoomImages";

const colors = ["#A8B5A2", "#A7BED3", "#C98276", "#CBC5B9", "#8FA59A", "#B6AEA1"];

function publicPath(url: string) {
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

test("la landing usa un render completo y distinto para cada color", async () => {
  const sources = colors.map(getLandingRoomImage);
  assert.equal(new Set(sources).size, colors.length);
  assert.ok(sources.every((source) => source.endsWith(".webp")));
  assert.ok(sources.every((source) => source !== LANDING_ROOM_BASE_IMAGE));
  await Promise.all([LANDING_ROOM_BASE_IMAGE, ...sources].map((source) => access(publicPath(source))));
});

test("todos los renders promocionales mantienen exactamente las dimensiones de la base", async () => {
  const base = await sharp(publicPath(LANDING_ROOM_BASE_IMAGE)).metadata();
  assert.deepEqual([base.width, base.height], [1672, 941]);
  for (const color of colors) {
    const variant = await sharp(publicPath(getLandingRoomImage(color))).metadata();
    assert.deepEqual([variant.width, variant.height], [base.width, base.height]);
  }
});

test("un color desconocido vuelve a la sala original", () => {
  assert.equal(getLandingRoomImage("#000000"), LANDING_ROOM_BASE_IMAGE);
});
