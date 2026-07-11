import { downloadBlob } from "@/lib/exportImage";
import { validateImportedProject } from "@/lib/projects/projectValidation";
import type { InteriorProject } from "@/types/project";

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function exportProjectFile(project: InteriorProject) {
  if (!project.originalImageBlob) throw new Error("Missing image");
  const dataUrl = await blobToDataUrl(project.originalImageBlob);
  const portable = { ...project, originalImageBlob: undefined, originalImage: { ...project.originalImage, dataUrl } };
  downloadBlob(new Blob([JSON.stringify(portable)], { type: "application/json" }), `${project.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "proyecto"}.interior-project.json`);
}

export async function importProjectFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".interior-project.json") || file.size > 250 * 1024 * 1024) throw new Error("INVALID_PROJECT");
  const project = validateImportedProject(JSON.parse(await file.text()));
  const originalImageBlob = await dataUrlToBlob(project.originalImage.dataUrl!);
  const now = new Date().toISOString();
  const thumbnail = project.thumbnail && /^data:image\/(jpeg|png);base64,/i.test(project.thumbnail) ? project.thumbnail : undefined;
  return { ...project, id: crypto.randomUUID(), createdAt: now, updatedAt: now, thumbnail, originalImage: { ...project.originalImage, type: originalImageBlob.type, size: originalImageBlob.size, dataUrl: undefined }, originalImageBlob };
}
