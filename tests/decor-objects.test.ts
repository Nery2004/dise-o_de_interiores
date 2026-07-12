import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { decorObjects } from "@/data/decorObjects";
import { EMPTY_DECOR_FILTERS, filterDecorObjects, getSimilarDecorObjects, matchesDecorSearch, normalizeDecorSearchText } from "@/lib/decor/filterDecorObjects";
import { decorObjectCategories, isSelectableDecorObject } from "@/types/decor-object";

test("el catálogo incluye al menos 40 objetos, ids únicos y todas las categorías iniciales", () => {
  assert.ok(decorObjects.length >= 40);
  assert.equal(new Set(decorObjects.map((object) => object.id)).size, decorObjects.length);
  const categories = new Set(decorObjects.map((object) => object.category));
  decorObjectCategories.forEach((category) => assert.ok(categories.has(category), `falta la categoría ${category}`));
  assert.ok(decorObjects.every(isSelectableDecorObject));
});

test("todos los assets y miniaturas son WebP locales, distintos y físicamente disponibles", async () => {
  for (const object of decorObjects) {
    assert.match(object.assetUrl, /^\/decor\/.+\.webp$/);
    assert.match(object.thumbnailUrl, /^\/decor\/.+-thumb\.webp$/);
    assert.notEqual(object.assetUrl, object.thumbnailUrl);
    await access(path.join(process.cwd(), "public", object.assetUrl));
    await access(path.join(process.cwd(), "public", object.thumbnailUrl));
    const signature = await readFile(path.join(process.cwd(), "public", object.assetUrl));
    assert.equal(signature.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(signature.subarray(8, 12).toString("ascii"), "WEBP");
    const assetMetadata = await sharp(signature).metadata();
    const thumbnailMetadata = await sharp(path.join(process.cwd(), "public", object.thumbnailUrl)).metadata();
    assert.equal(assetMetadata.hasAlpha, true);
    assert.equal(assetMetadata.width, object.width);
    assert.equal(assetMetadata.height, object.height);
    assert.equal(thumbnailMetadata.width, 320);
    assert.equal(thumbnailMetadata.height, 320);
  }
});

test("la búsqueda ignora acentos y mayúsculas en todos los campos", () => {
  const lamp = decorObjects.find((object) => object.name === "Lámpara de piso negra");
  assert.ok(lamp);
  assert.equal(normalizeDecorSearchText("LÁMPARA"), "lampara");
  assert.equal(matchesDecorSearch(lamp, "LAMPara industrial sala negra"), true);
  const pot = decorObjects.find((object) => object.name === "Maceta alta de cerámica");
  assert.ok(pot && matchesDecorSearch(pot, "ceramica pasillo"));
});

test("los filtros se combinan con búsqueda, habitación, color y favoritos", () => {
  const target = decorObjects.find((object) => object.name === "Sillón moderno beige");
  assert.ok(target);
  const results = filterDecorObjects(decorObjects, "beige", {
    ...EMPTY_DECOR_FILTERS,
    category: "sofas",
    style: "moderno",
    room: "sala",
    dominantColor: "#D8C3A5",
    favoritesOnly: true,
  }, [target.id]);
  assert.deepEqual(results.map((object) => object.id), [target.id]);
});

test("los similares excluyen el objeto actual y priorizan categoría y estilo", () => {
  const source = decorObjects[0];
  const similar = getSimilarDecorObjects(source, decorObjects, 4);
  assert.equal(similar.length, 4);
  assert.ok(similar.every((object) => object.id !== source.id));
  assert.equal(similar[0].category, source.category);
});
