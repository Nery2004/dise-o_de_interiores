import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "tests/fixtures/wall-detection");

test("dataset local incluye los quince escenarios y metadatos uniformes", async () => {
  const directories = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.equal(directories.length, 15);
  const required = ["clean-front-wall", "side-wall", "wall-with-window", "wall-with-curtain", "wall-with-sofa", "wall-with-pictures", "wall-with-television", "wall-with-door", "dark-wall", "white-wall", "multiple-walls", "wall-with-columns", "strong-light", "wall-with-shadows", "partially-occluded-wall"];
  assert.deepEqual(directories, [...required].sort());
  for (const directoryName of directories) {
    const directory = path.join(root, directoryName);
    const metadata = JSON.parse(await readFile(path.join(directory, "metadata.json"), "utf8")) as {
      id: string; difficulty: string; expectedWalls: number; expectedMasks: string[]; recordedPredictions: string[]; exclusionMasks: Record<string, string>; synthetic: boolean; width: number; height: number;
    };
    assert.equal(metadata.id, directoryName);
    assert.ok(["easy", "medium", "hard"].includes(metadata.difficulty));
    assert.equal(metadata.synthetic, true);
    assert.equal(metadata.expectedMasks.length, metadata.expectedWalls);
    assert.equal(metadata.recordedPredictions.length, metadata.expectedWalls);
    await access(path.join(directory, "image.webp"));
    for (const filename of [...metadata.expectedMasks, ...metadata.recordedPredictions, ...Object.values(metadata.exclusionMasks)]) {
      const { data, info } = await sharp(path.join(directory, filename)).greyscale().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.width, metadata.width);
      assert.equal(info.height, metadata.height);
      assert.ok([...data].every((value) => value === 0 || value === 255), `${directoryName}/${filename} debe ser binaria`);
    }
  }
});
