import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type Chunk = { file: string; bytes: number };

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : Promise.resolve([target]);
  }));
  return values.flat();
}

function routeFromManifest(file: string) {
  const relative = path.relative(path.join(process.cwd(), ".next/server/app"), file);
  return `/${relative.replace(/\/page_client-reference-manifest\.js$/, "").replace(/^page_client-reference-manifest\.js$/, "")}`.replace(/\/$/, "/");
}

async function main() {
  const appDirectory = path.join(process.cwd(), ".next/server/app");
  const manifests = (await walk(appDirectory)).filter((file) => file.endsWith("page_client-reference-manifest.js"));
  const chunkSizes = new Map<string, number>();
  const routes = await Promise.all(manifests.map(async (manifest) => {
    const contents = await readFile(manifest, "utf8");
    const files = [...new Set(contents.match(/static\/chunks\/[^"]+\.js/g) ?? [])];
    const chunks: Chunk[] = await Promise.all(files.map(async (file) => {
      let bytes = chunkSizes.get(file);
      if (bytes === undefined) {
        bytes = (await stat(path.join(process.cwd(), ".next", file))).size;
        chunkSizes.set(file, bytes);
      }
      return { file, bytes };
    }));
    return {
      route: routeFromManifest(manifest),
      bytes: chunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
      chunks: chunks.sort((a, b) => b.bytes - a.bytes),
    };
  }));
  routes.sort((a, b) => b.bytes - a.bytes);
  const report = {
    generatedAt: new Date().toISOString(),
    note: "Los bytes por ruta incluyen chunks compartidos y por eso no deben sumarse.",
    uniqueClientJavaScriptBytes: [...chunkSizes.values()].reduce((sum, bytes) => sum + bytes, 0),
    routes,
  };
  const markdown = `# Análisis de bundle\n\nGenerado ${report.generatedAt}. ${report.note}\n\n| Ruta | JS cliente | Chunks |\n|---|---:|---:|\n${routes.map((route) => `| ${route.route} | ${(route.bytes / 1024).toFixed(1)} KiB | ${route.chunks.length} |`).join("\n")}\n\n## Chunks principales del editor\n\n${(routes.find((route) => route.route === "/editor")?.chunks ?? []).slice(0, 12).map((chunk) => `- ${(chunk.bytes / 1024).toFixed(1)} KiB — \`${chunk.file}\``).join("\n")}\n`;
  await mkdir(path.join(process.cwd(), "reports"), { recursive: true });
  await writeFile(path.join(process.cwd(), "reports/bundle-analysis.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(process.cwd(), "reports/bundle-analysis.md"), markdown);
  process.stdout.write(`Bundle analizado: ${routes.length} rutas · ${(report.uniqueClientJavaScriptBytes / 1024).toFixed(1)} KiB únicos\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
